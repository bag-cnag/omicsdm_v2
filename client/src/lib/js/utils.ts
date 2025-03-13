export const triggerDownload = (href: string) => {
    const downloadLink = document.createElement('a')
    downloadLink.href = href;
    downloadLink.download = "";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}
