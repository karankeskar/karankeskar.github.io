(function ($) {
  "use strict";

  // Sticky menu: solid background once the page is scrolled
  $(window).scroll(function () {
    if ($(".navigation").offset().top > 100) {
      $(".navigation").addClass("nav-bg");
    } else {
      $(".navigation").removeClass("nav-bg");
    }
  });
})(jQuery);
