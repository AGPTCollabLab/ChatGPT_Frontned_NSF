// Remove Markdown heading markers ("## ") from the start of each line so
// headings read as plain text. Other text, such as "#hashtag", is unchanged.
export function stripHeadingMarkers(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/^ {0,3}#{1,6}[ \t]+/gm, '');
}
