/* Myopic Sheep jquery file */

/*global $, document, window, alert, jQuery, console, History*/

var activeTab = "", lastScroll;

function goBack() {
    window.history.back();
}

function checkPage() {
    'use strict';
    
    var pages = $(".menuItems a"),
        i,
        len = pages.length,
        curr = window.location.href,
        next = null,
        prev = null;
    
    for (i = 0; i < len; i += 1) {
        if ((i !== len - 1) && (curr.indexOf(pages[i]) === 0)) {
            next = pages[i + 1];
        }
            
        if ((i !== 0) && (curr.indexOf(pages[i]) === 0)) {
            prev = pages[i - 1];
        }
    }
    
    return [next, prev];
}


function navbarReady() {
    'use strict';
    
    var navbar = $(".miniNav"),
        scrollPos = $(window).scrollTop();
    
    if (scrollPos < lastScroll) { // Scrolls back up
        navbar.removeClass("vanish-top");
        
    } else if (scrollPos > 5) {
        navbar.addClass("vanish-top");
    } else {
        navbar.removeClass("vanish-top");
    }
    
    if (scrollPos <= 5) {
        navbar.removeClass("vanish-top");
    }
    
    lastScroll = scrollPos;
    
}



/* Click, hover and scroll related animation */
(function mouseIt() {
    'use strict';
    
    $(function () {
        
        $(window).scroll(function () {
            navbarReady();
        });
        
        
        $(window).scroll(function () {
            
            $(".lab-content").each(function (i) {
            
                var bottom_of_object = $(this).position().top + $(this).outerHeight(),
                    bottom_of_window = $(window).scrollTop() + $(window).height(),
                    
                    // Adjust when the fading starts 
                    threshold = bottom_of_object - $(window).height() + 40;
                
                if (bottom_of_window >= threshold) {
                    $(this).animate({opacity: 1}, 1000);
                    $(this).find(".lab-link").addClass("fall");
                }
            });
        });
        
        
        $('a[data-toggle="tab"]').on('click', function (e) {
            activeTab = $(e.target).attr('href');
        });
        
    });
    
}(jQuery));



(function startUp() {
    'use strict';
    
    $(function () {
        
        var loc = window.location.href.match(/(\/[a-z]+)\//),
            noscript = $("noscript"),
            winHeight = $(window).height();
        
        if (activeTab && activeTab === loc[1]) {
            $(".miniNav").find('a[href="' + activeTab + '"]').addClass("active-nav-link");
        } else {
            $(".miniNav").find('a[href="' + loc[1] + '"]').addClass("active-nav-link");
        }
        
        $(".full-screen").height(winHeight);
                 
        $(window).on('resize', function (e) {
            winHeight = $(window).height();
            $(".full-screen").height(winHeight);
        });
        
        $(window).on('orientationchange', function (e) {
            winHeight = $(window).height();
            $(".full-screen").height(winHeight);
        });
        
        $(window).on('beforeunload', function () {
            switch (loc[0]) {
            case ("/home/"):
                $("header").animate({opacity: 0}, 1000);
                break;
            default:
                break;
            }
        });
        
        $(window).on('load', function () {
            noscript.css("display", "none");
            $("main.full-screen-mod").css("opacity", 0);
            switch (loc[0]) {
            case ("/lab/"):
                $(".lab-content").slice(1).css('opacity', 0);
                $("html, body").addClass("black-background");
                break;
            case ("/home/"):
                $("main.full-screen-mod").animate({opacity: 1}, 1000);
                $("html, body").addClass("home-background");
                break;
            default: 
                $(".full-screen").animate({opacity: 1}, 200);
                break;
            }
        });
        
    });
}(jQuery));

// Do this to make sure the canvas takes up the entire viewport's frame.
window.addEventListener('load', function() {
    var winHeight = $(window).height();
    $(".full-screen").height(winHeight);
    $(".full-screen").animate({opacity: 1}, 200);
});



