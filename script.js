var x = document.getElementById("login");
var y = document.getElementById("signup");
var z = document.getElementById("btn");
var loginBtn = document.getElementById("loginBtn");
var registerBtn = document.getElementById("registerBtn");

function showRegisterForm() {
    x.classList.remove("active");
    y.classList.add("active");
    z.style.left = "110px";

    loginBtn.classList.remove("active-text");
    loginBtn.classList.add("inactive-text");
    registerBtn.classList.add("active-text");
    registerBtn.classList.remove("inactive-text");
}

function showLoginForm() {
    x.classList.add("active");
    y.classList.remove("active");
    z.style.left = "0";

    loginBtn.classList.add("active-text");
    loginBtn.classList.remove("inactive-text");
    registerBtn.classList.remove("active-text");
    registerBtn.classList.add("inactive-text");
}


document.addEventListener("DOMContentLoaded", function () {
    document.querySelector("a[href='#signup']").addEventListener("click", function (e) {
        e.preventDefault(); 
        showRegisterForm();
    });

    document.querySelector("a[href='#login']").addEventListener("click", function (e) {
        e.preventDefault(); 
        showLoginForm();
    });

    showLoginForm();
});