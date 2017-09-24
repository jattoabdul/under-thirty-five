$(document)
  .ready(function () {
    $('.button-collapse').sideNav({
      menuWidth: 250, // Default is 300
      edge: 'left', // Choose the horizontal origin
      closeOnClick: true, // Closes side-nav on <a> clicks, useful for Angular/Meteor
      draggable: true // Choose whether you can drag to open on touch screens
    });
    $('select').material_select();
    $('.modal').modal();
    $('.card-panel.write').click(function(){
      $('#writeModal').modal('open');
    });

    $('#gender_reg.toggle-input .male').click(function () {
      $('#gender_reg.toggle-input .option').removeClass('selected');
      $('#gender_reg.toggle-input .male').addClass('selected');
    });
    $('#gender_reg.toggle-input .female').click(function () {
      $('#gender_reg.toggle-input .option').removeClass('selected');
      $('#gender_reg.toggle-input .female').addClass('selected');
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
      var pass = $('#password_reg').val().trim();
      var verPass = $('#password_confirm_reg').val().trim();
      if(pass === verPass){
        createNewUser();
        return false;
      } else {
        Materialize.toast("Passwords do not match", 3000, 'rounded');
        return false;
      }
    });

    $('#email_reg').blur(function(){
      var typedMail = document.getElementById('email_reg').value;
      if(isValidEmail(typedMail)){
        $.ajax({
          type: "POST",
          url: '/api/checkemailExistence',
          data: {
            query: typedMail
          },
          success: function(msg) {
            if(msg){
              $('#step-1_reg > form > div:nth-child(4) > p:nth-child(4) > span').addClass('disabled');
              Materialize.toast("Email have been used before", 3000, 'rounded');
            } else {
              $('#step-1_reg > form > div:nth-child(4) > p:nth-child(4) > span').removeClass('disabled');
            }
          }
        });
      }
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
      password: $('#password_reg').val().trim()
    },
    success: function (data) {
      $('#reg > div').addClass('hide');
      $('#reg #step-1_reg').removeClass('hide');
      $('#reg').addClass('hide');
      $('#success_reg').removeClass('hide');

      $('#success_reg > div:first-child p').addClass('rubberBand');
      Materialize.toast(data, 4000);
    },
    error: function (error) {
      Materialize.toast("Sorry, there was an error creating you account", 5000);
      // window
      // .location
      // .reload();
      $('#reg > div').addClass('hide');
      $('#reg #step-1_reg').removeClass('hide');
    }
  });
  return false;
}

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
      Materialize.toast(data + " Opening timeline...", 4000);
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

function attemptReset(){
  $('input').removeClass('shake');
  $(".loginSpinner").removeClass("hide");
  var emailReset = $('#login_id').val();
  var passReset = $('#phone_num').val();
  if(isValidEmail(emailReset) && isDigitsOnly(passReset)) {
    $.ajax({
      type: 'POST',
      url: '/api/forgot',
      data: {
        email: emailReset,
        phone: passReset
      },
      success: function(data){
        $(".loginSpinner").addClass("hide");
        Materialize.toast(data, 3000, 'rounded');
        $('.forget-view').addClass('hide');
        $('#forget_step2').removeClass('hide');
      },
      error: function(e){
        $(".loginSpinner").addClass("hide");
        if(e.responseText === "Phone number is incorrect"){
          $('#phone_num').addClass('shake');
          $('#phone_num').focus();
          Materialize.toast(e.responseText, 4000, 'rounded');
        } else if(e.responseText === "Email doesn't exist") {
          $('#login_id').addClass('shake');
          $('#login_id').focus();
          Materialize.toast(e.responseText, 4000, 'rounded');
        } else {
          Materialize.toast("there was an error resetting you password", 4000, 'rounded');
        }
      }
    });
  }
}

function proceedToChangePass() {
  $(".loginSpinner").removeClass("hide");
  $('input').removeClass('shake');
  var resetKey = $('#reset_code').val();
  $.ajax({
    url: '/api/check_reset_code',
    type: 'POST',
    data: {
      code: resetKey,
      email: $('#login_id').val()
    },
    success: function(data){
      console.log(data);
      if(data){
        $('.forget-view').addClass('hide');
        $('#forget_step3').removeClass('hide');
      } else {
        toast('code invalid', 4000);
        $('#reset_code').addClass('shake');
        $('#reset_code').focus();
      }
    },
    error: function(e) {
      toast('there was an error verifying your code', 4000);
    }
  });
}

function changePassword() {
  var pass = $('#password_reset').val().trim();
  var verPass = $('#password_confirm_reset').val().trim();
  if(pass !== verPass){
    toast('Passwords do not match', 4000);
  } else {
    $.ajax({
      url: '/api/change_password/',
      type: 'POST',
      data: {
        email: $('#login_id').val(),
        newPass: $('#password_reset').val(),
        code: $('#reset_code').val()
      },
      success: function(data){
        toast(data);
        window.location.pathname = login;
      },
      error: function(e) {
        toast(e.responseText);
        console.log(e);
      }
    });
  }
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

function toast(message, duration){
  if(message){
    if(duration){
      Materialize.toast(message, duration,'rounded');
    } else {
      Materialize.toast(message, 3000, 'rounded');
    }
  } else {
    console.log("doing nothing");
  }
}
