export const GOOGLE_FORM_ENDPOINT = "/api/forms.php";
export const RECAP_URL =
  "https://docs.google.com/spreadsheets/d/1GJJDb0AEv4a3yugzQpv2hMhU1ke9g_zIbsNGQMNlmg8/edit";
const extensions = /\.(jpe?g|png|webp|pdf|docx|xlsx|pptx)$/i;

export function validateAttachments(files) {
  if (files.length > 3) throw new Error("Pilih paling banyak 3 berkas.");
  let total = 0;
  for (const file of files) {
    if (!extensions.test(file.name) || file.name.length > 180)
      throw new Error("Gunakan JPG, PNG, WebP, PDF, DOCX, XLSX, atau PPTX.");
    if (!file.size || file.size > 2 * 1024 * 1024)
      throw new Error("Ukuran setiap berkas harus antara 1 byte dan 2 MB.");
    total += file.size;
  }
  if (total > 5 * 1024 * 1024) throw new Error("Total lampiran maksimal 5 MB.");
}

export async function encodeAttachments(files) {
  validateAttachments(files);
  return Promise.all(
    files.map(async (file) => {
      const buffer = await file.arrayBuffer(),
        bytes = new Uint8Array(buffer);
      let binary = "";
      for (let offset = 0; offset < bytes.length; offset += 16384)
        binary += String.fromCharCode(
          ...bytes.subarray(offset, offset + 16384),
        );
      const digest = new Uint8Array(
        await crypto.subtle.digest("SHA-256", buffer),
      );
      return {
        name: file.name,
        bytes: file.size,
        data: btoa(binary),
        sha256: [...digest]
          .map((value) => value.toString(16).padStart(2, "0"))
          .join(""),
      };
    }),
  );
}

async function readResponse(response) {
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error(
      "Layanan formulir belum tersambung. Silakan hubungi pengurus.",
    );
  const value = await response.json();
  if (!response.ok || value.ok !== true) {
    const error = new Error(
      typeof value.message === "string"
        ? value.message
        : "Belum berhasil menyimpan. Coba lagi atau hubungi pengurus.",
    );
    error.status = response.status;
    throw error;
  }
  return value;
}

export async function getGoogleFormToken(transport = fetch) {
  const response = await transport(GOOGLE_FORM_ENDPOINT, {
    credentials: "same-origin",
    redirect: "error",
    cache: "no-store",
    headers: { "X-Annahl-Form": "1" },
  });
  const result = await readResponse(response);
  if (typeof result.token !== "string" || result.token.length > 200)
    throw new Error("Sesi formulir belum tersedia. Muat ulang halaman.");
  return result.token;
}

export async function sendGoogleSubmission(
  kind,
  payload,
  id,
  files,
  token,
  website = "",
  transport = fetch,
) {
  if (!["pendaftaran", "donasi"].includes(kind))
    throw new Error("Jenis formulir tidak tersedia.");
  if (!payload.nama?.trim() || payload.nama.trim().length < 2)
    throw new Error("Isi nama minimal dua karakter.");
  if (kind === "donasi" && !/^[1-9]\d{0,11}$/.test(payload.jumlah || ""))
    throw new Error("Isi nominal donasi dengan angka yang valid.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await transport(GOOGLE_FORM_ENDPOINT, {
      method: "POST",
      credentials: "same-origin",
      redirect: "error",
      headers: { "Content-Type": "application/json", "X-Annahl-Form": "1" },
      signal: controller.signal,
      body: JSON.stringify({ id, kind, payload, files, token, website }),
    });
    const receipt = await readResponse(response);
    if (receipt.id !== id || receipt.kind !== kind)
      throw new Error(
        "Belum menerima tanda terima yang sesuai. Coba kirim lagi.",
      );
    return receipt;
  } finally {
    clearTimeout(timer);
  }
}

export function bindGoogleSubmission(form, kind, collect, successMessage) {
  const button = form.querySelector('[type="submit"]');
  const notification = form.querySelector('[role="status"]');
  const fileInput = form.querySelector("[data-form-files]");
  const fileList = form.querySelector("[data-file-list]");
  const fileFeedback = form.querySelector("[data-file-feedback]");
  const clearFiles = form.querySelector("[data-clear-files]");
  let busy = false,
    id = "",
    lastSignature = "",
    token = "",
    tokenTime = 0;
  // Warm up the session without storing any form fields or files in browser storage.
  let tokenPromise = getGoogleFormToken()
    .then((value) => {
      token = value;
      tokenTime = Date.now();
      return value;
    })
    .catch(() => null);

  function showFiles() {
    if (!fileInput) return;
    fileList.replaceChildren();
    fileFeedback.textContent = "";
    const files = [...fileInput.files];
    clearFiles.hidden = !files.length;
    try {
      validateAttachments(files);
    } catch (error) {
      fileFeedback.textContent = error.message;
      fileInput.setCustomValidity(error.message);
      return;
    }
    fileInput.setCustomValidity("");
    for (const file of files) {
      const item = document.createElement("li"),
        name = document.createElement("span"),
        size = document.createElement("small");
      name.textContent = file.name;
      size.textContent = `${Math.ceil(file.size / 1024)} KB`;
      item.append(name, size);
      fileList.append(item);
    }
  }
  fileInput?.addEventListener("change", showFiles);
  clearFiles?.addEventListener("click", () => {
    fileInput.value = "";
    showFiles();
    fileInput.focus();
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    const previous = button.innerHTML,
      controls = [...form.elements].map((control) => [
        control,
        control.disabled,
      ]);
    busy = true;
    controls.forEach(([control]) => {
      control.disabled = true;
    });
    button.textContent = "Menyiapkan kiriman…";
    notification.textContent = "";
    try {
      const values = collect(),
        files = await encodeAttachments([...(fileInput?.files || [])]);
      const signature = JSON.stringify({
        values,
        files: files.map(({ name, sha256 }) => ({ name, sha256 })),
      });
      if (signature !== lastSignature) {
        id = crypto.randomUUID();
        lastSignature = signature;
      }
      await tokenPromise;
      if (!token || Date.now() - tokenTime > 3000000) {
        token = await getGoogleFormToken();
        tokenTime = Date.now();
      }
      button.textContent = files.length
        ? "Menyimpan isian dan lampiran…"
        : "Menyimpan isian…";
      await sendGoogleSubmission(
        kind,
        values,
        id,
        files,
        token,
        form.querySelector("[data-website]")?.value || "",
      );
      notification.dataset.state = "success";
      notification.textContent = successMessage;
      form.reset();
      showFiles();
      id = "";
      lastSignature = "";
    } catch (error) {
      if (error.status === 403) {
        token = "";
        tokenPromise = Promise.resolve(null);
      }
      notification.dataset.state = "error";
      notification.textContent =
        error.name === "AbortError"
          ? "Belum menerima konfirmasi penyimpanan. Isian tetap ada; silakan kirim lagi."
          : error.message ||
            "Belum berhasil mengirim. Isian tetap ada; coba lagi.";
    } finally {
      busy = false;
      controls.forEach(([control, disabled]) => {
        control.disabled = disabled;
      });
      button.innerHTML = previous;
    }
  });
}
