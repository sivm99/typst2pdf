export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    alert("URL copied to clipboard!");
  });
};

export const openInNewTab = (url: string) => {
  window.open(url, "_blank");
};
