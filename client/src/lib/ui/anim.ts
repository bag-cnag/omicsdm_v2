export function horizontallyScrollable(element: HTMLElement){
    element.addEventListener('wheel', (event) => {
        event.preventDefault();
        element.scrollBy({
            left: (event.deltaY + event.deltaX)/2,
        });
    });
}
