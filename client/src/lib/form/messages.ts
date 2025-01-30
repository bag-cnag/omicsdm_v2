export function clearFormErrors(){
    var errors = document.getElementsByClassName('error');
    while (errors[0])
        errors[0].parentNode!.removeChild(errors[0]);
}


export function displayFormError(err: string, parent?: string | null){
    let qs = ""
    if (parent){
        qs += "#"+parent
    }
    qs += " "

    const errorMessagesDiv = document.querySelector(qs + " .errorMessages");
    const errorMessage = document.createElement('p');
    errorMessage.textContent = err;
    errorMessage.className = "error";
    errorMessagesDiv?.appendChild(errorMessage)

    setTimeout(function () {
        errorMessagesDiv?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
   }, 50);
}


export function displayFormSuccess(msg: string, parent?: string | null){
    let qs = ""
    if (parent){
        qs += "#"+parent
    }
    qs += " "

    const fillerDiv = document.querySelector(qs + " .successMessagesFiller");
    const successMessagesDiv = document.querySelector(qs + " .successMessages");

    if(fillerDiv && successMessagesDiv){
        const successMessage = document.createElement('p');
        successMessage.textContent = msg + '✓';
        successMessage.className = "success";
        successMessage.classList.add('m-3');

        (fillerDiv as HTMLElement).style.display = "none";
        successMessagesDiv?.appendChild(successMessage)

        // fade transition.
        const t = 2.5;
        var s = (successMessagesDiv as HTMLElement).style
        s.transition = t.toString() + "s";
        s.opacity = "0";

        setTimeout(function () {
            successMessagesDiv?.removeChild(successMessage)
            s.opacity = "1";
            (fillerDiv as HTMLElement).style.display = "block";
        }, t * 1000)
    }
}
