export const previewPolicy = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline' data:; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
export function previewDocument(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const meta of doc.querySelectorAll('meta[http-equiv]')) {
    if (meta.httpEquiv.toLowerCase() === 'refresh') meta.remove();
  }
  const policy = doc.createElement('meta');
  policy.httpEquiv = 'Content-Security-Policy'; policy.content = previewPolicy;
  doc.head.prepend(policy);
  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}
