function myfuction(){
    var passw = document.getElementById("mypassword");
    if(passw.type == "password"){
        passw.type ="text";
    } else {
        passw.type = "password";
    }
    
}