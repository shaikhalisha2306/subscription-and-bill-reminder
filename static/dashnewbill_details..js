

// Schedule toggle
const scheduleToggle = document.querySelectorAll('input[type="checkbox"]')[0];
scheduleToggle.addEventListener("change", function(){
    if(this.checked){
        alert("Schedule reminder enabled");
    } else {
        alert("Schedule reminder disabled");
    }
});

// Recurring bill toggle
const recurringToggle = document.querySelectorAll('input[type="checkbox"]')[1];
recurringToggle.addEventListener("change", function(){
    if(this.checked){
        alert("Recurring bill enabled");
    } else {
        alert("Recurring bill disabled");
    }
});

// Save button
const saveBtn = document.querySelector(".save");

saveBtn.addEventListener("click", function(){

    const billName = document.querySelector('input[type="text"]').value;
    const amount = document.querySelector('input[placeholder="$"]').value;
    const dueDate = document.querySelector('input[type="date"]').value;

    if(billName === "" || amount === "" || dueDate === ""){
        alert("Please fill all required fields");
        return;
    }

    const bill = {
        name: billName,
        amount: amount,
        due: dueDate,
        status: "upcoming"
    };

  

    // Add new bill
    bills.push(bill);

  

    alert("Bill saved!");

    // redirect to dashboard
    window.location.href = "/details";
});
    //} else {
      //  alert("Bill saved successfully!");
        //document.getElementById("billform").reset();
    //}

//});

