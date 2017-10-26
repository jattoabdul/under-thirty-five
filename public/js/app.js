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
    $('input').addClass('animated');
    $('.card-panel.write').click(function () {
      $('#writeModal').modal('open');
    });

    $('.edu-trigger').click(function () {
      $('#modal2').modal('open');
    });

    $('.prof-trigger').click(function () {
      $('#modal1').modal('open');
    });

    $('.editable__placeholder, .modal-content__body').click(function () {
      $('.editable__placeholder').addClass('hide');
    });
    $('#oyaPost').click(function () {
      writeApost();
    });
    $('#oyaAddEdu').click(function () {
      addEducation();
    });
    $('#oyaAddProf').click(function () {
      addProfessionalExp();
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

      // TODO: Add shaky animation on every failed form input
      if (reg_name.length < 3 || reg_phone.length < 11) {
        Materialize.toast("Please fill all fields to proceed");
      } else if (!isValidEmail(reg_mail)) {
        Materialize.toast("Please enter your email correctly");
      } else if (reg_name.length > 3 && reg_mail.length > 5 && reg_phone.length >= 11) {
        $('#reg > div').addClass('hide');
        $('#reg #step-2_reg').removeClass('hide');
      } else {
        Materialize.toast('Please fill all field appropriately', 4000);
      }

      var options = {  
        weekday: "long", year: "numeric", month: "short",  
        day: "numeric"  
      };

      jQuery(function ($) {
        $("#toBposted[contenteditable]")
          .focusout(function () {
            var element = $(this);
            if (!element.text().trim().length) {
              element.empty();
            }
          });
      });
    });

    $('#reg > #step-2_reg .next-step').click(function () {
      var reg_age = Number($('#age_reg').val());
      var reg_address = $('#current_address_reg').val();
      var reg_state = $('#state_origin_reg').val();
      var reg_town = $('#town_origin_reg').val();

      if (reg_age >= 15 && reg_address.length > 5 && reg_state.length >= 3 && reg_town.length >= 3) {
        $('#reg > div').addClass('hide');
        $('#reg #step-3_reg').removeClass('hide');
      } else {
        Materialize.toast('Please fill all field appropriately', 4000);
      }
    });

    $('#reg > #step-3_reg .next-step').click(function () {
      var pass = $('#password_reg')
        .val()
        .trim();
      var verPass = $('#password_confirm_reg')
        .val()
        .trim();
      if (pass === verPass) {
        createNewUser();
        return false;
      } else {
        Materialize.toast("Passwords do not match", 3000, 'rounded');
        return false;
      }
    });

    function formatDate(date) {
      var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
      ];
      var dates = new Date(date);
      var day = dates.getDate();
      var monthIndex = dates.getMonth();
      var year = dates.getFullYear();
    
      return monthNames[monthIndex] + ' ' + year;
    };

    $('#email_reg').blur(function () {
      var typedMail = document
        .getElementById('email_reg')
        .value;
      if (isValidEmail(typedMail)) {
        $.ajax({
          type: "POST",
          url: '/api/checkemailExistence',
          data: {
            query: typedMail
          },
          success: function (msg) {
            if (msg) {
              $('#step-1_reg > form > div:nth-child(4) > p:nth-child(4) > span').addClass('disabled');
              Materialize.toast("Email have been used before", 3000, 'rounded');
            } else {
              $('#step-1_reg > form > div:nth-child(4) > p:nth-child(4) > span').removeClass('disabled');
            }
          }
        });
      }
    });

    $('.follow-action.follow').click(function (e) {
      e.preventDefault();
      var clickedTarget = $(this);
      follow(clickedTarget);
    });

    $('.follow-action.unfollow').click(function (e) {
      var clickedTarget = $(this);
      unFollow(clickedTarget);
    });

    $('#search_profile').keyup(function () {
      var query = $('#search_profile')
        .val()
        .toLowerCase();
      $.ajax({
        type: 'get',
        url: '/api/search',
        data: {
          search: query
        },
        success: function (data) {
          $('#searchResults').removeClass('hide');
          $('#searchItemsUl').empty();
          $.map(data, (user) => {
            $('#searchItemsUl').append(`<li><a href="/profile/${user._id}">${user.fullname}</a></li>`)
          });
        },
        error: function (err) {
          // console.log(JSON.stringify(err, null, 2));
          Materialize.toast(JSON.stringify(err.message, null, 2));
        }
      })
    });

    // function to add education
    function addEducation () {
      var education = {
        institution: $('#institution_edit').val().trim(),
        programe: $('#programe_edit').val().trim(),
        url: $('#url_edit_edu').val().trim(),
        startDate: $('#startDate_edit_edu').val().trim(),
        endDate: $('#endDate_edit_edu').val().trim(),    
      }
      if (education) {
        $('#oyaAddEdu').addClass('disabled');
        $.ajax({
          url: "/api/add_useredudetails",
          type: "POST",
          data: {
            fieldType: "education",
            institution: education.institution,
            programe: education.programe,
            url: education.url,
            startDate: education.startDate,
            endDate: education.endDate
          },
          success: function(data) {
            console.log('on Add Edu Data array', data);
            $('#oyaAddEdu').removeClass('disabled');
            $('#institution_edit').text('');
            $('#programe_edit').text('');
            $('#url_edit_edu').text('');
            $('#startDate_edit_edu').text('');
            $('#endDate_edit_edu').text('');
            
            var schools = data.data.education;
            console.log('on add and fetch success', schools);
            var schoolItem = "";
            schools.forEach((school) => {
              schoolItem += '<div class="body">';
              schoolItem += '<span class="blue-text">';
              schoolItem += '<i class="x1.5 icon ion-edit" id="edit"></i>';
              schoolItem += '<i class="icon ion-android-done-all x1.5" id="save"></i>';
              schoolItem += '</span>';
              schoolItem += '&nbsp;';
              schoolItem += '<h5 class="institution">' + school.institution + '';
              schoolItem += '</h5>';
              schoolItem += '<p class="programme_certificate">'+ school.programe +'</p>';
              schoolItem += '<p class="study_time_span"><span class="startdate_edu">'+ formatDate(school.startDate) +'</span> - <span class="enddate_edu">'+ formatDate(school.endDate) +'</span></p>';
              schoolItem += '<img src="https://logo.clearbit.com/' + school.url + '" alt="" class="job-logo right">';
              schoolItem += '</div>';
            });
            $('#eduItem').empty();
            // $('#eduItem').prepend(schoolItem);
            $('#eduItem').html(schoolItem);
            $('#modal2').modal('close');
          },
          error: function(error) {
            $('#oyaAddEdu').addClass('disabled');
            $('#oyaAddEdu').removeClass('disabled');
            $('#modal2').modal('close');
            console.log(error);
          }
        })

      }
      return;
    }

    //function to add prof experience
    function addProfessionalExp () {
      var professionalExp = {
        post: $('#post_edit').val().trim(),
        where: $('#where_edit').val().trim(),
        url: $('#url_edit').val().trim(),
        startDate: $('#startDate_edit').val().trim(),
        endDate: $('#endDate_edit').val().trim(),    
        jobDesc: $('#jobDesc_edit').val().trim(),    
      }
      if (professionalExp) {
        $('#oyaAddProf').addClass('disabled');
        $.ajax({
          url: "/api/add_userprofdetails",
          type: "POST",
          data: {
            fieldType: "professional_experience",
            post: professionalExp.post,
            where: professionalExp.where,
            url: professionalExp.url,
            startDate: professionalExp.startDate,
            endDate: professionalExp.endDate,
            jobDesc: professionalExp.jobDesc
          },
          success: function(data) {
            console.log('on Add Prof Exp Data array', data);
            $('#oyaAddProf').removeClass('disabled');
            $('#post_edit').text('');
            $('#where_edit').text('');
            $('#url_edit').text('');
            $('#startDate_edit').text('');
            $('#endDate_edit').text('');
            $('#jobDesc_edit').text('');

            var experiences = data.data.professional_experience;
            console.log('on add and fetch experiences success', experiences);
            var experienceItem = "";
            experiences.forEach((experience) => {
              experienceItem += '<div class="body">';
              experienceItem += '<span class="blue-text">';
              experienceItem += '<i class="x1.5 icon ion-edit" id="edit2"></i>';
              experienceItem += '<i class="icon ion-android-done-all x1.5" id="save2"></i>';
              experienceItem += '</span>';
              experienceItem += '<h5 class="job-title">' + experience.post + '';
              experienceItem += '</h5>';
              experienceItem += '<p class="job-location">' + experience.where + '</p>';
              experienceItem += '<p class="job-time_span">';
              experienceItem += '<span class="startdate_prof">'+ formatDate(experience.startDate) +'</span> - <span class="enddate_prof">'+ formatDate(experience.endDate) +'</span>';
              experienceItem += '</p>';
              experienceItem += '<img src="https://logo.clearbit.com/' + experience.url + '" alt="" class="job-logo right">';
              experienceItem += '<p class="job-details">' + experience.jobDesc + '</p>';
              experienceItem += '</div>';
            });
            $('#profItem').empty();
            // $('#eduItem').prepend(schoolItem);
            $('#profItem').html(experienceItem);
            $('#modal1').modal('close');
          },
          error: function(error) {
            $('#oyaAddProf').addClass('disabled');
            $('#oyaAddProf').removeClass('disabled');
            $('#modal1').modal('close');
            console.log(error);
          }
        })

      }
      return;
    }

    // start inline editing for education
    $('#edit').click(function(){
      $('#edit').hide();
      $('.update').addClass('editable');
      $('.institution').attr('contenteditable', 'true');
      $('.programme_certificate').attr('contenteditable', 'true');
      $('.startdate_edu').attr('contenteditable', 'true');
      $('.enddate_edu').attr('contenteditable', 'true');
      $('#save').show();
    });

    $('#save').click(function(){
      $('#save').hide();
      $('.update').removeClass('editable');
      $('.institution').removeAttr('contenteditable'); 
      $('.programme_certificate').removeAttr('contenteditable', 'true');
      $('.startdate_edu').removeAttr('contenteditable', 'true');
      $('.enddate_edu').removeAttr('contenteditable', 'true');
      $('#edit').show(); 
    });

    // start inline editing for professional experience

    $('#edit2').click(function(){
      $('#edit2').hide();
      $('.update').addClass('editable');
      $('.job-title').attr('contenteditable', 'true');
      $('.job-location').attr('contenteditable', 'true');
      $('.startdate_prof').attr('contenteditable', 'true');
      $('.enddate_prof').attr('contenteditable', 'true');
      $('.job-details').attr('contenteditable', 'true');
      $('#save2').show();
    });

    $('#save2').click(function(){
      $('#save2').hide();
      $('.update').removeClass('editable');
      $('.job-title').removeAttr('contenteditable'); 
      $('.job-location').removeAttr('contenteditable'); 
      $('.startdate_prof').removeAttr('contenteditable'); 
      $('.enddate_prof').removeAttr('contenteditable'); 
      $('.job-details').removeAttr('contenteditable'); 
      $('#edit2').show(); 
    });

    // end of inline editting

    $(document).click(function (e) {
      var target = e.target;
      if (!$(target).is('#searchResults')) {
        $('#searchResults').addClass('hide');
      }
    })
  });

function createNewUser() {
  $.ajax({
    type: "POST",
    url: "/api/signup",
    data: {
      fullname: $("#fullname_reg")
        .val()
        .trim(),
      mail: $("#email_reg")
        .val()
        .trim(),
      gender: $('#gender_reg>.option.selected')
        .text()
        .toLowerCase(),
      phone: $("#phone_reg").val(),
      age: $('#age_reg').val(),
      currentAddress: $('#current_address_reg').val(),
      originState: $('#state_origin_reg').val(),
      originTown: $('#town_origin_reg').val(),
      password: $('#password_reg')
        .val()
        .trim()
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
      // window .location .reload();
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

function attemptReset() {
  $('input').removeClass('shake');
  $(".loginSpinner").removeClass("hide");
  var emailReset = $('#login_id').val();
  var passReset = $('#phone_num').val();
  if (isValidEmail(emailReset) && isDigitsOnly(passReset)) {
    $.ajax({
      type: 'POST',
      url: '/api/forgot',
      data: {
        email: emailReset,
        phone: passReset
      },
      success: function (data) {
        $(".loginSpinner").addClass("hide");
        Materialize.toast(data, 3000, 'rounded');
        $('.forget-view').addClass('hide');
        $('#forget_step2').removeClass('hide');
      },
      error: function (e) {
        $(".loginSpinner").addClass("hide");
        if (e.responseText === "Phone number is incorrect") {
          $('#phone_num').addClass('shake');
          $('#phone_num').focus();
          Materialize.toast(e.responseText, 4000, 'rounded');
        } else if (e.responseText === "Email doesn't exist") {
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
    success: function (data) {
      if (data) {
        $('.forget-view').addClass('hide');
        $('#forget_step3').removeClass('hide');
      } else {
        toast('code invalid', 4000);
        $('#reset_code').addClass('shake');
        $('#reset_code').focus();
      }
    },
    error: function (e) {
      toast('there was an error verifying your code', 4000);
    }
  });
}

function changePassword() {
  $(".loginSpinner").removeClass("hide");
  $('input').removeClass('shake');
  var pass = $('#password_reset')
    .val()
    .trim();
  var verPass = $('#password_confirm_reset')
    .val()
    .trim();
  if (pass !== verPass) {
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
      success: function (data) {
        toast(data);
        window.location.pathname = login;
      },
      error: function (e) {
        toast(e.responseText);
      }
    });
  }
}

function writeApost() {
  var newPostContent = $('#toBposted')
    .text()
    .trim();
  if (newPostContent.length > 1) {
    $(".loginSpinner").removeClass("hide");
    $('#oyaPost').addClass('disabled');
    $.ajax({
      url: "/api/writePost",
      type: 'POST',
      data: {
        post: newPostContent
      },
      success: function (data) {
        $('#oyaPost').removeClass('disabled');
        $(".loginSpinner").addClass("hide");
        $('#toBposted').text('');
        $('#writeModal').modal('close');
        // FIXME: use socket to handle this!

      },
      error: function (e) {
        $('#oyaPost').addClass('disabled');
        $('#oyaPost').removeClass('disabled');
        $(".loginSpinner").addClass("hide");
      }
    });
  }
}

function editProfile() {
  $(".loginSpinner").removeClass("hide");
  var data = {};
  data.fullname = $('#fullname_edit').val() || '';
  data.email = $('#email_edit').val() || '';
  data.occupation = $('#occupation_edit').val() || '';
  data.current_address = $('#address_edit').val() || '';
  data.phone = $('#phone_edit').val() || '';
  data.state = $('#state_edit').val() || '';
  data.town = $('#town_edit').val() || '';
  data.local_gov = $('#local_gov_edit').val() || '';
  data.party = $('#party_edit').val() || '';
  data.summary = $('#summary').val() || '';
  data.fb = $('#fb_edit').val() || '';
  data.gplus = $('#google_edit').val() || '';
  data.tw = $('#tw_edit').val() || '';
  data.dob = new Date($('#dob_edit').val()).getTime() || '';

  $.ajax({
    data: data,
    url: '/api/edit_profile',
    type: 'patch',
    success: function (data) {
      $(".loginSpinner").addClass("hide");
      toast(data);
    },
    error: function (e) {
      $(".loginSpinner").addClass("hide");
      toast('update unsuccessful, try again');
    }
  });

  return false;
}

function isValidEmail(email) {
  "use strict";

  if (!email || email == "") 
    return false;
  
  email = email.trim();
  if (email == "" || !email) 
    return false;
  let regex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
  return regex.test(email);
}

function isDigitsOnly(string) {
  "use strict";

  return (!isNaN(parseInt(string)) && isFinite(string));
}

function toast(message, duration) {
  if (message) {
    if (duration) {
      Materialize.toast(message, duration, 'rounded');
    } else {
      Materialize.toast(message, 3000, 'rounded');
    }
  } else {
  }
}

function hardTrim(text) {

  if (!exists(text)) {
    return ""
  }
  text = text
    .replace(/^\&nbsp\;|<br?\>*/gi, "")
    .replace(/\&nbsp\;|<br?\>$/gi, "")
    .trim();

  return text
}

function createUpdate(posterName, posterPic, posterLocalG, creationTime, postContent) {
  var post = "";
  post += '<div class="card-panel update">';
  post += '<div class="head">';
  post += '<img src="./images/abiola-4.jpg" alt="Abiola" class="profile">';
  post += '<h4 class="creator_fullname">Ariwoola Roqeeb</h4>';
  post += '<p class="creator_origin">Itesiwaju Local Government</p>';
  post += '<p class="posted_when">Just now</p>';
  post += '</div>';
  post += '<div class="body">';
  post += '<p>Computers and Technologies are exponentially getting more powerful and will t' +
      'ake away millions of jobs but      creating even bigger opportunities. Companies' +
      ' and Organisations are now virtualizing key business value chain processes into ' +
      'Platforms and Digital networks</p>';
  post += '</div>';
  post += '<div class="foot">';
  post += '<p>';
  post += '<span class="no_of_views left post-widget">';
  post += '<i class="icon ion-ios-eye-outline"></i>';
  post += '1299 views';
  post += '</span>';
  post += '<span class="no_of_queries left post-widget">';
  post += '<i class="icon ion-ios-chatboxes-outline"></i>';
  post += '4 queries';
  post += '</span>';
  post += '</p>';
  post += '</div>';
  post += '</div>';
}

function follow(clickedTarget) {
  var user_to_follow_id = clickedTarget
    .attr('id')
    .split('follow_')[1];

  $.ajax({
    type: 'post',
    url: '/api/follow',
    data: {
      toFollow: user_to_follow_id
    },
    success: function (data) {
      clickedTarget.text('unfollow');
      $(this).toggleClass('follow unfollow');
    },
    error: function (err) {
      toast(err.responseText);
    }
  })
}

function unFollow(clickedTarget) {
  var user_to_follow_id = clickedTarget
    .attr('id')
    .split('follow_')[1];

  $.ajax({
    type: 'post',
    url: '/api/unfollow',
    data: {
      toFollow: user_to_follow_id
    },
    success: function (data) {
      clickedTarget.text('follow');
      $(this).toggleClass('unfollow follow');
    },
    error: function (err) {
      toast(err.responseText);
    }
  })
}

var hostname = window.location.hostname;
var socket = io();

socket.on('newPost', function (res) {
  var postData = res.postData;
  // body, author_id, createdOn, author_pic
  $.ajax({
    type: 'post',
    url: '/api/getBasicUserData',
    data: {
      id: postData.author_id
    },
    success: function (data) {
      var author_data = data;
      var author_name = author_data.fullname;
      var author_localG = author_data.local_government;
      var author_state = author_data.origin_state;
      var author_occupation = author_data.occupation;
      var author_pic = author_data.profile_pic;
      var postBody = postData.body;
      var postTime = postData.createdOn;
      var author_location = author_localG
        ? author_localG + ' - ' + author_state
        : author_state;

      var post = '';
      post += '<div class="card-panel update">';
      post += '<div class="head">';
      post += '<img src="' + author_pic + '" alt="' + author_name + '" class="profile">';
      post += '<h4 class="creator_fullname">' + author_name + '</h4>';
      post += '<p class="creator_origin">' + author_location + '</p>';
      post += '<p class="posted_when"><abbr class="timeago" title="' + postTime + '"></abbr></p>';
      post += '</div>';
      post += '<div class="body">';
      post += '<p>' + postBody + '</p>';
      post += '</div>';
      post += '<div class="foot">';
      post += '<p>';
      post += '<span class="no_of_views left post-widget">';
      post += '<i class="icon ion-ios-eye-outline"></i> &nbsp;';
      post += '<span class="view_figure">0</span> views';
      post += '</span>';
      post += '<span class="no_of_queries left post-widget">';
      post += '<i class="icon ion-ios-chatboxes-outline"></i> &nbsp;';
      post += '<span class="queries_figure">0</span> queries';
      post += '</span>';
      post += '</p>';
      post += '</div>';
      post += '</div>';

      $('#gbogboPost').prepend(post);

      jQuery(".posted_when>.timeago").timeago();
    },
    error: function (error) {
    }
  })

  // var picUrl = "https://www.gravatar.com/avatar/ " + author_pic ; var time =
  // new Date(res.statusData.time).toISOString(); var addStatus = '<div
  // class="post"><div class="timestamp"><abbr class="timeago" title="'+time+
  // 			'"></abbr></div><a class="colorize"
  // href="/users/'+res.statusData.username+ 			'"><div class="smallpic"><img
  // class="smallpic_img" src="'+res.statusData.image+ 			'"/></div>	<div
  // class="smallname">'+res.statusData.username+ 			'</div></a><br><div
  // class="statusbody">'+res.statusData.body+'</div></div>';
  // $('#socket').prepend(addStatus);   var pageuser = $('#theusername').text();
  // if (pageuser == res.statusData.username && pageuser != myname) {
  // 	$('#postsOuter').prepend(addStatus);   }   jQuery("abbr.timeago").timeago();
});