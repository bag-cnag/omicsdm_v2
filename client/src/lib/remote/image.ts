// export async function check_url_is_image(url: string): Promise<boolean> {
//     try {
//         const res = await fetch(url, {method:'HEAD'});
//         const content = res.headers.get('content-type');
//         if (!content){
//             return false;
//         }
//         return content.includes('image/');
//     } catch {
//         return false;
//     }
// }

export function check_url_is_image(url: string | undefined): Promise<boolean> {
    // Version above only checking HEAD is running into CORS issues.
    // This is heavier but works client side only.
    return new Promise((resolve) => {
        const img = new Image();
        if (!url){
            () => resolve(false);
        }

        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url!;
    });
}
