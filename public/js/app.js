$(document)
  .ready(function () {
    $('.button-collapse').sideNav({
      menuWidth: 250, // Default is 300
      edge: 'left', // Choose the horizontal origin
      closeOnClick: true, // Closes side-nav on <a> clicks, useful for Angular/Meteor
      draggable: true // Choose whether you can drag to open on touch screens
    });
    $('#gender_reg.toggle-input .option').click(function () {
      $('#gender_reg.toggle-input .option').toggleClass('selected');
    });

    $('#reg > #step-1_reg .next-step').click(function () {
      var reg_name = $('#fullname_reg').val();
      var reg_mail = $('#email_reg').val();
      var reg_gender = $('#gender_reg>.option.selected').text();
      var reg_phone = $('#phone_reg').val();

      if (reg_name.length < 3 || reg_phone.length < 11) {
          Materialize.toast("Please fill all fields to proceed");
      } else if(!isValidEmail(reg_mail)) {
        Materialize.toast("Please enter your email correctly");
      } else if (reg_name.length > 3 && reg_mail.length > 5 && reg_phone.length >= 11) {
        $('#reg > div').addClass('hide');
        $('#reg #step-2_reg').removeClass('hide');
      } else {
        Materialize.toast('Please fill all field appropriately', 4000);
      }
    });

    $('#reg > #step-2_reg .next-step').click(function () {
      var reg_age = Number($('#age_reg').val());
      var reg_address = $('#current_address_reg').val();
      var reg_state = $('#state_origin_reg').val();
      var reg_town = $('#town_origin_reg').val();

      if(reg_age >= 15 && reg_address.length > 5 && reg_state.length >= 3 && reg_town.length >= 3) {
        $('#reg > div').addClass('hide');
        $('#reg #step-3_reg').removeClass('hide');
      } else {
        Materialize.toast('Please fill all field appropriately', 4000);
      }

    });

    $('#reg > #step-3_reg .next-step').click(function () {
      createNewUser();
      return false;
    });
  });

function createNewUser() {
  $.ajax({
    type: "POST",
    url: "/api/signup",
    data: {
      fullname: $("#fullname_reg").val().trim(),
      mail: $("#email_reg").val().trim(),
      gender: $('#gender_reg>.option.selected')
        .text()
        .toLowerCase(),
      phone: $("#phone_reg").val(),
      age: $('#age_reg').val(),
      currentAddress: $('#current_address_reg').val(),
      originState: $('#state_origin_reg').val(),
      originTown: $('#town_origin_reg').val(),
      password: $('#password_reg').val()
    },
    success: function (data) {
      $('#reg > div').addClass('hide');
      $('#reg #step-1_reg').removeClass('hide');
      $('#reg').addClass('hide');
      $('#success_reg').removeClass('hide');

      $('#success_reg > div:first-child p').addClass('rubberBand');
      Materialize.toast(data.message, 4000);
    },
    error: function (error) {
      Materialize.toast("Sorry, there was an error creating you account", 5000);
      window
      .location
      .reload();
    }
  });
  return false;
}

// function attemptLogin() {   $.ajax({     type: "POST",     url: "/api/login",
//     data: {       loginCred: $("#cred_login").val(),       password:
// $("#password_login").val()     },     success: function (data) {
// $(".loginSpinner").addClass("hide");       Materialize.toast(data + "
// Redirecting to Admin Page...", 4000);       window         .location
// .reload();     },     error: function (error) {
// $(".loginSpinner").addClass("hide");       Materialize.toast("Incorrect login
// credentials", 5000);       // $("#email_login").val('');
// $("#password_login").val('');       $("#password_login").focus();     }   });
//   return false; }

function attemptLogin() {
  $(".loginSpinner").removeClass("hide");
  $.ajax({
    type: "POST",
    url: "/api/login",
    data: {
      loginCred: $("#login_id").val(),
      password: $("#login_pass").val()
    },
    success: function (data) {
      $(".loginSpinner").addClass("hide");
      Materialize.toast(data.message + " Opening timeline...", 4000);
      window
        .location
        .reload();
    },
    error: function (error) {
      $(".loginSpinner").addClass("hide");
      Materialize.toast("Incorrect login credentials", 5000);
      // $("#email_login").val('');
      $("#password_login").val('');
      $("#password_login").focus();
    }
  });
  return false;
}


function isValidEmail(email) {
  "use strict";

  if (!email || email == "") return false;

  email = email.trim();
  if (email == "" || !email) return false;
  let regex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
  return regex.test(email);
}

function isDigitsOnly(string) {
  "use strict";

  return (!isNaN(parseInt(string)) && isFinite(string));
}