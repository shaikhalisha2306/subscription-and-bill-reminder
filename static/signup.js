
        document.getElementById("submit").addEventListener("click",function(event){
          var name=document.getElementById("username").value;
          var email=document.getElementById("emails").value;
          var passw=document.getElementById("passw").value;
          var confirmpass=document.getElementById("confirmpass").value;
         
             if(passw!== confirmpass){
              alert("Check password");
            }
          
          
         });
        
         
    
        
      
