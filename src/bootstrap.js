import { readAuthFlow } from './auth-flow.js';

const flow = readAuthFlow(window.location.href);
if (flow.kind || flow.error) {
  // Forward the untouched link to the admin app before the SDK consumes its session.
  window.location.replace(`/admin.html${window.location.search}${window.location.hash}`);
} else {
  import('./main.js');
}
