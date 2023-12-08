jQuery.fn.isOnScreen = function() {
    var win = jQuery(window);
    var viewport = { top: win.scrollTop(), left: win.scrollLeft() };
    viewport.right = viewport.left + win.width();
    viewport.bottom = viewport.top + win.height();
    var bounds = this.offset();
    bounds.right = bounds.left + this.outerWidth();
    bounds.bottom = bounds.top + this.outerHeight();
    return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));
}

;(function ($) {
    'use strict'

    // Global vars
    var isJqueryReady = false
    var $containerMasonry = null
    var topOffset = 0
    var $siteHeader = null
    var changeTopOffset = null
    var isStickyHeader = false
    var scrollTopEl = null
    var scrollTopVisible = false
    var $megamenu = null
    var isMegamenu = false
    var isFixedFooter = false

    // Global functions
    function throttle (fn, wait, raf) {
        wait = wait || 0
        raf = typeof raf === 'boolean' ? raf : true
        var waiting = false
        return function () {
            if (waiting) return
            var _this = this
            var _args = arguments
            waiting = true
            window.setTimeout(function () {
                waiting = false
                if (raf) {
                    window.requestAnimationFrame(function () { fn.apply(_this, _args) })
                } else {
                    fn.apply(_this, _args)
                }
            }, wait)
        }
    }
    function replaceUrlParam(url, paramName, paramValue) {
        if (paramValue == null)
            paramValue = '';
        var pattern = new RegExp('\\b(' + paramName + '=).*?(&|$)')
        if (url.search(pattern) >= 0) {
            return url.replace(pattern, '$1' + paramValue + '$2');
        }
        return url + (url.indexOf('?') > 0 ? '&' : '?') + paramName + '=' + paramValue
    }
    function getUrlParameter(sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;
        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    }
    function submenuHeight() {
        if (window.innerWidth <= 991) return
        $('.menu-item-depth-0 > .sub-menu').each(function() {
            $(this).css({ 'display': 'none', 'height': 'auto' });
            $(this).attr('data-height', $(this).height());
            $(this).attr('style', '');
        });
    }
    function makeTopOffsetChanger () {
        var $wpBar = $('#wpadminbar')
        var $topBar = $('.top-bar')
        var hasTopBar = $topBar.length
        var isHeaderTransparent = $('.site-header-style-transparent').length
        var isBoxedMenu = $('.site-header-style-boxed').length
        var isFullScreenMenuType = $('.site-header-style-full-width').length || isBoxedMenu
        var $preHeaderWrap = $('.preheader-wrap')
        var isSearchOpen = $('.site-search-opened').length
        var $siteSearch = $('.site-search')
        var $navBarWrapper = $('.nav-bar-wrapper')

        return function () {
            topOffset = $siteHeader.offset().top
            var wpBarHeight = $wpBar.length ? $wpBar.height() : 0

            if (isHeaderTransparent && hasTopBar) {
                var topBarHeight = $topBar.innerHeight()
                topOffset = window.innerWidth < 782
                    ? wpBarHeight + topBarHeight
                    : topBarHeight + Number.parseInt($('.nav-wrap').css('top').replace('px', ''))
            }
            if (window.innerWidth > 782) {
                topOffset -= wpBarHeight
            }

            if (isFullScreenMenuType) {
                if (window.innerWidth > 991) {
                    topOffset += $preHeaderWrap.height()
                } else {
                    topOffset = 0
                    if (window.innerWidth < 782) {
                        topOffset += wpBarHeight
                    }
                    if (isSearchOpen) {
                        topOffset += $siteSearch.height()
                    }
                }
                if (isBoxedMenu) {
                    topOffset -= $navBarWrapper.height() / 2
                }
            }
        }
    }
    function stickyHeader() {
        if (window.scrollY > topOffset) {
            $siteHeader.addClass('site-header-sticky-active')
        } else {
            $siteHeader.removeClass('site-header-sticky-active')
        }
    }
    function topBarSize() {
        $('.top-bar .container').css('height', $('.top-bar-left').innerHeight() + $('.top-bar-right').innerHeight() + 15);
    }
    function megamenu() {
        $('> .sub-menu', $megamenu).css('left', 'auto');
        if (window.innerWidth <= 991) return
        $megamenu.each(function() {
            var left = $('.site-header  .container').offset().left - $(this).find('> .sub-menu').offset().left;
            $(this).find('> .sub-menu').css('left', left + 15);
        });
    }
    function buildPagination() {
        var $isotope = $('.isotope')
        if (!$isotope.length) return
        var page = Number.parseInt($isotope.attr('data-page'), 10)
        var perPage = Number.parseInt($isotope.attr('data-per-page'), 10)
        var number = Number.parseInt($isotope.attr('data-number'), 10)
        $('.portfolio-pagination').html('');
        var frag = document.createDocumentFragment()
        for (var i = 1; i <= Math.ceil(number/perPage); i++) {
            var btn = document.createElement('button')
            btn.type = 'button'
            btn.className = i === page
                ? 'portfolio-pagination-item portfolio-pagination-selected'
                : 'portfolio-pagination-item'
            btn.textContent = i.toString()
            frag.appendChild(btn)
        }
        $('.portfolio-pagination').append(frag);
    }
    function portfolioAjax() {
        var $isotope = $('.isotope')
        if (!$isotope.length) return
        $isotope.addClass('processing');
        var category = $('.filter .selected').attr('data-filter');
        if (category === '*') category = '';
        $.post(
            anps.ajaxurl,
            {
                'action': 'anps_portfolio_ajax',
                'per_page': $isotope.attr('data-per-page'),
                'category': category,
                'mobile_class': $isotope.attr('data-mobile-class'),
                'type': $isotope.attr('data-type'),
                'columns': $isotope.attr('data-columns'),
                'order': $isotope.attr('data-order'),
                'page': $('.portfolio-pagination-selected').html(),
                'orderby': $isotope.attr('data-orderby'),
            },
            function(response){
                var el = $(response).filter('.portfolio');

                var filterParam = getUrlParameter('filter') || '*';
                var pre = filterParam !== '*' ? '.': '';

                $isotope.isotope({ filter: pre + filterParam, });
                $isotope.attr('data-number', el.attr('data-number'));
                $isotope.isotope('remove', $('.isotope-item'));
                $isotope.isotope('insert', $(el.html()));

                $('.isotope img').on('load', function() {
                    buildPagination();
                    $isotope.isotope('layout');
                    $isotope.removeClass('processing');
                });

            }
        );
    }
    function checkForOnScreen() {
        $('.counter-number').each(function(index) {
            var $el = $(this)
            if (!$el.hasClass('animated') && $el.isOnScreen()) {
                $el.addClass('animated')
                $el.countTo({ speed: 5000 })
            }
        })
    }
    function handleScrollTopLinkVisibility () {
        if (window.scrollY > 300 && !scrollTopVisible) {
            scrollTopVisible = true
            scrollTopEl.fadeIn()
        } else if (window.scrollY < 300 && scrollTopVisible) {
            scrollTopVisible = false
            scrollTopEl.fadeOut()
        }
    }
    function checkCoordinates (str) {
        if (!str) return false
        var coords = str.split(',')
        if (coords.length !== 2) return false
        return coords.reduce(function (acc, cur) {
            return acc ? !Number.isNaN(Number.parseFloat(cur)) : false
        }, true)
    }
    function rightMenuMobilePosition () {
        var leftMenu = $('.nav-bar-wrapper-left nav');
        var rightMenu = $('.nav-bar-wrapper-right nav');
        if (rightMenu.length && rightMenu.length && window.innerWidth < 991) {
            rightMenu.css({ top: 'calc(100% + ' + (leftMenu.outerHeight() - 25) + 'px)', 'padding-top': '0' });
        }
    }
    function fixedFooter() {
        if (!isFixedFooter) return
        $('.site-wrapper').css('margin-bottom', $('.site-footer').innerHeight());
        $('.site-wrapper').css('padding-bottom', $('.site-footer').css('margin-top'));
    }
    function anpsLightbox() {
        if (typeof rlArgs === 'undefined') return
        $(window).on('grid:items:added', function () {
            $('.prettyphoto').addClass('vc-gitem-link-ajax')
        });
        if (rlArgs.script === 'swipebox') {
            $('.prettyphoto').swipebox({ hideBarsDelay: 0 });
        } else if (rlArgs.script === 'prettyphoto') {
            $('.prettyphoto').prettyPhoto();
        } else if (rlArgs.script === 'fancybox') {
            $('.prettyphoto').fancybox();
        } else if (rlArgs.script === 'nivo') {
            $('.prettyphoto').nivoLightbox();
        } else if (rlArgs.script === 'imagelightbox') {
            $('.prettyphoto').imageLightbox();
        }
    }
    function isotopeLayout() {
        var el = $('.isotope');
        if (!el.length) return
        var parent = $('body');
        if (this && this !== window) {
            parent = $(this).parents('.filter');
            el = $(this).parents('.wpb_wrapper').find('.isotope');
        }
        var filterParam = getUrlParameter('filter');
        if (filterParam === undefined) {
            filterParam = parent.find('.filter > li:first-of-type button').data('filter');
        }
        var pre = filterParam !== '*' ? '.': '';
        parent.find('button[data-filter="' + filterParam + '"]').addClass('selected');
        var options = {
            itemSelector: '.isotope-item',
            layoutMode: 'fitRows',
            filter: pre + filterParam,
        };
        if(el.hasClass('random')) {
            if ($('.isotope').width() > 1140) {
                options.layoutMode = 'masonry';
                options.masonry = { columnWidth: 292, };
            } else if ($('.isotope').width() > 940) {
                options.layoutMode = 'masonry';
                options.masonry = { columnWidth: 242, };
            }
        }
        el.isotope(options);
    }


    $(function () {
        isJqueryReady = true
        $containerMasonry = $('.blog-masonry')
        topOffset = 0
        $siteHeader = $('.site-header')
        changeTopOffset = makeTopOffsetChanger()
        isStickyHeader = $siteHeader.hasClass('site-header-sticky')
        scrollTopEl = $('#scrolltop')
        $megamenu = $('.megamenu')
        isMegamenu = $megamenu.length

        if (isStickyHeader) {
            changeTopOffset()
            stickyHeader()
        }

        submenuHeight()

        $('.site-search-close').on('click', function() {
            $('.site-wrapper').removeClass('site-search-opened');
        });
        $('.site-search-toggle button').on('click', function() {
            if ($('.site-search').length) {
                if( !$('.site-search-opened').length ) { $(window).scrollTop(0); }
                $('.site-wrapper').toggleClass('site-search-opened');
            } else {
                $('.site-search-minimal').toggleClass('site-search-minimal--active');
            }
        });

        $('.navbar-toggle').on('click', function() {
            $('.site-navigation').toggleClass('site-navigation-opened');
            if ($('.site-navigation-opened').length) {
                var offset = $('.nav-wrap').height();
                if (window.innerWidth > 782) { offset += $('#wpadminbar').height(); }
                $('.site-navigation-opened').css({ 'max-height': window.innerHeight - offset, });
            }
        });

        if (!$('.menu-item-depth-0').length) {
            $('.site-navigation > ul > li').addClass('menu-item-depth-0');
        }
        if ($('.site-search-toggle') && !$('.site-search-toggle').hasClass('hidden-sm')) {
            $('.cartwrap').addClass('cart-search-space');
        }

        $('.menu-item-depth-0 > a').on('mouseenter', function() {
            if (window.innerWidth > 991) {
                var $subMenu = $(this).siblings('.sub-menu');
                $subMenu.css('height', $subMenu.attr('data-height'));
            }
        });

        $('.menu-item-depth-0 > .sub-menu').on('mouseenter', function() {
            if (window.innerWidth > 991) {
                $(this).css('height', $(this).attr('data-height'));
                $(this).css('overflow', 'visible');
            }
        });

        $('.menu-item-depth-0 > a').on('mouseleave', function() {
            if (window.innerWidth > 991) {
                var $subMenu = $(this).siblings('.sub-menu');
                $subMenu.css('height', -1);
            }
        });

        $('.menu-item-depth-0 > .sub-menu').on('mouseleave', function() {
            if (window.innerWidth > 991) {
                $(this).css('height', -1);
                $(this).css('overflow', '');
            }
        });

        $('.top-bar-close').on('click', function() {
            if( !$('.top-bar .container').attr('style') ) {
                topBarSize();
                $('.top-bar').addClass('top-bar-show').removeClass('top-bar-hide');
            } else {
                $('.top-bar .container').attr('style', '');
                $('.top-bar').removeClass('top-bar-show').addClass('top-bar-hide');
            }
            $(this).trigger('blur');
        });

        if (isMegamenu) megamenu()

        $('.site-navigation a[href*="#"]:not([href="#"]):not([href*="="]), .anps-smooth-scroll').click(function(e) {
            if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') ||
                location.hostname == this.hostname) {
                var target = $(this.hash);
                target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
                if (target.length) {
                    e.preventDefault();
                    var $targetoffset = target.offset().top - $('.nav-wrap').outerHeight(true) + 20;
                    $('html,body').animate({ scrollTop: $targetoffset }, 1000);
                    return false;
                }
            }
        });

        $('.nav-tabs a').on('click', function(e) {
            e.preventDefault()
            $(this).tab('show')
        });

        if ($('.isotope[data-per-page]')) buildPagination()

        $('body').on('click', '.portfolio-pagination-item', function() {
            $('.portfolio-pagination-selected').removeClass('portfolio-pagination-selected');
            $(this).addClass('portfolio-pagination-selected');
            $('.isotope').attr('data-page', $(this).html());
            portfolioAjax();
        });

        if ($containerMasonry.length) {
            $containerMasonry.imagesLoaded(function() {
                $containerMasonry.isotope({
                    itemSelector: '.blog-masonry .post',
                    animationOptions: { duration: 750, queue: false, }
                });
            });
        }

        checkForOnScreen()

        if ($(window).height > 700) {
            $('.fullscreen').css('height', $(window).height() + 'px');
        }

        $('.widget_product_search form').addClass('searchform');
        $('.searchform input[type="submit"]').remove();
        $('.searchform div').append('<button type="submit" class="fa fa-search" id="searchsubmit" value=""></button>');
        $('.searchform input[type="text"]').attr('placeholder', anps.search_placeholder);
        $('.blog-masonry').parent().removeClass('col-md-12');
        $('.post.style-3').parent().parent().removeClass('col-md-12').parent().removeClass('col-md-12');

        $('.site-navigation > div > ul').unwrap();

        $('.show-register').on('click', function() {
            $('#customer_login h3, #customer_login .show-register').addClass('hidden');
            $('#customer_login .register').removeClass('hidden');
        });

        function doParallaxBg ($el, speed) {
            $(window).on('scroll', function() {
                window.requestAnimationFrame(function () {
                    var yPos = -($(window).scrollTop() / speed)
                    $el.css({ backgroundPosition: '50% ' + yPos + 'px' })
                })
            })
        }

        $('.parallax-window[data-type="background"]').each(function() {
            var $bgobj = $(this)
            var speed = Number.parseInt($bgobj.data('speed'), 10)
            if (Number.isNaN(speed) || !speed) return
            doParallaxBg($bgobj, speed)
        })

        // $('.paraslider .tp-bgimg.defaultimg').each(function() {
        //     var $bgobj = $(this)
        //     doParallaxBg($bgobj, 5)
        // })

        $('.site-navigation ul').doubleTapToGo();
        $('.ls-wp-fullwidth-helper:after').animate({ width: "90px" }, "slow");

        if (scrollTopEl) {
            handleScrollTopLinkVisibility()
            $('a', scrollTopEl).on('click', function (e) {
                e.preventDefault()
                $('body,html').animate({ scrollTop: 0 }, 800);
            })
        }

        $('.owl-carousel').each(function() {
            var $owl = $(this);
            var numberItems = $owl.attr('data-col');
            var autoplay = $owl.attr('data-autoplay') === 'true';
            var autoplayTimeout = $owl.attr('data-autoplay-timeout') ? Number.parseInt($owl.attr('data-autoplay-timeout'), 10) : 5000;
            var autoplayPause = $owl.attr('data-autoplay-pause') === 'true';
            var itemsXS = $owl.attr('data-xs') ? Number.parseInt($owl.attr('data-xs'), 10) : 1;
            var itemsSM = $owl.attr('data-sm') ? Number.parseInt($owl.attr('data-sm'), 10) : 2;
            var dataNav = !!$owl.attr('data-nav');
            var margin = $owl.attr('data-margin') ? Number.parseInt($owl.attr('data-margin'), 10) : 30;
            $owl.owlCarousel({
                loop: true,
                margin: margin,
                autoplay: autoplay,
                autoplayTimeout: autoplayTimeout,
                autoplayHoverPause: autoplayPause,
                responsiveClass: true,
                rtl: $('body').hasClass('rtl'),
                responsive: {
                    0: { items: itemsXS, nav: dataNav, slideBy: itemsXS, },
                    782: { items: itemsSM, nav: dataNav, slideBy: itemsSM, },
                    992: { items: numberItems, nav: dataNav, slideBy: numberItems, }
                }
            });
            $owl.parents('.wpb_wrapper').find('.owlnext').on('click', function() {
                $owl.trigger('next.owl.carousel');
            });
            $owl.parents('.wpb_wrapper').find('.owlprev').on('click', function() {
                $owl.trigger('prev.owl.carousel');
            });
        });

        if ($('body').hasClass('vertical-menu')) {
            $('.nav-wrap > .hide-menu').on('click', function() {
                $('header.vertical-menu, body.vertical-menu').toggleClass('hide-side-menu');
            });
        }

        $('.map').each(function() {
            var gmap = {
                zoom: $(this).attr('data-zoom') ? Number.parseInt($(this).attr('data-zoom'), 10) : 15,
                address: $(this).attr('data-address'),
                markers: $(this).attr('data-markers'),
                icon: $(this).attr('data-icon'),
                typeID: $(this).attr('data-type'),
                ID: $(this).attr('id')
            };
            var gmapScroll = $(this).attr('data-scroll') ? $(this).attr('data-scroll') : 'false';
            var markersArray = [];
            var bound = new google.maps.LatLngBounds();
            if (gmapScroll === 'false') {
                gmap.draggable = false;
                gmap.scrollwheel = false;
            }
            if (gmap.markers) {
                gmap.markers = gmap.markers.split('|');
                gmap.markers.forEach(function(marker) {
                    if (!marker) return
                    marker = $.parseJSON(marker);
                    if (checkCoordinates(marker.address)) {
                        marker.latLng = marker.address.split(',');
                        delete marker.address;
                    }
                    markersArray.push(marker);
                });
                $('#' + gmap.ID).gmap3({
                    zoom: gmap.zoom,
                    draggable: gmap.draggable,
                    scrollwheel: gmap.scrollwheel,
                    mapTypeId: google.maps.MapTypeId[gmap.typeID],
                    styles: gmap.styles
                }).marker(markersArray).then(function(results) {
                    var center = null;
                    if (typeof results[0].position.lat !== 'function' ||
                        typeof results[0].position.lng !== 'function') {
                        return false;
                    }
                    results.forEach(function(m, i) {
                        if (markersArray[i].center) {
                            center = new google.maps.LatLng(m.position.lat(), m.position.lng());
                        } else {
                            bound.extend(new google.maps.LatLng(m.position.lat(), m.position.lng()));
                        }
                    });
                    if (!center) center = bound.getCenter();
                    this.get(0).setCenter(center);
                }).infowindow({ content: '' }).then(function(infowindow) {
                    var map = this.get(0);
                    this.get(1).forEach(function(marker) {
                        if (!marker.data) return
                        marker.addListener('click', function() {
                            infowindow.setContent(decodeURIComponent(marker.data));
                            infowindow.open(map, marker);
                        });
                    });
                });
            }
            if (gmap.address) {
                if (checkCoordinates(gmap.address)) {
                    $('#' + gmap.ID).gmap3({
                        zoom: gmap.zoom,
                        draggable: gmap.draggable,
                        scrollwheel: gmap.scrollwheel,
                        mapTypeId: google.maps.MapTypeId[gmap.typeID],
                        center: gmap.address.split(',')
                    }).marker({
                        latLng: gmap.address.split(','),
                        options: { icon: gmap.icon }
                    });
                } else {
                    $('#' + gmap.ID).gmap3({
                        zoom: gmap.zoom,
                        draggable: gmap.draggable,
                        scrollwheel: gmap.scrollwheel,
                        mapTypeId: google.maps.MapTypeId[gmap.typeID],
                    }).latlng({
                        address: gmap.address
                    }).then(function(result) {
                        if (!result) return
                        this.get(0).setCenter(new google.maps.LatLng(result.lat(), result.lng()));
                    }).marker(function() {
                        return {
                            position: this.get(0).getCenter(),
                            icon: gmap.icon
                        };
                    });
                }
            }
        });

        $('.f-content--style-2').each(function () {
            $(this).parents('.vc_row').find('.vc_column-inner').css({ 'padding-left': '0px', 'padding-right': '0px', });
            $(this).parents('.vc_row').css({ 'padding-left': '15px', 'padding-right': '15px', });
            $(this).parents('[data-vc-full-width="true"]').css({ 'margin-left': '0', 'margin-right': '0', });
        });


        var openGallery = false;

        function changeThumb(el) {
            var $gallery = el.parents('.gallery-fs');
            if (!el.hasClass('selected')) {
                $gallery.find('> figure > img').attr('src', el.attr('href'));
                $gallery.find('> figure > figcaption').html(el.attr('title'));
                $gallery.find('.gallery-fs-thumbnails .selected').removeClass('selected');
                el.addClass('selected');
            }
        }

        var thumbCol = 6;
        var galleryParent = $('.gallery-fs').parents('[class*="col-"]');
        var galleryParentSize = Math.floor(galleryParent.outerWidth() / galleryParent.parent().outerWidth() * 100);
        if (galleryParentSize < 60) thumbCol = 5;
        if (galleryParentSize == 100) thumbCol = 9;
        var navText = ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'];

        if ($('html[dir="rtl"]').length) navText.reverse();

        function setOwlNav(e){
            if (e.page.size >= e.item.count) {
                if ($('html[dir="rtl"]').length) {
                    $(e.target).siblings('.gallery-fs-nav').children('a, button').css('transform', 'translateX(-83px)');
                } else {
                    $(e.target).siblings('.gallery-fs-nav').children('a, button').css('transform', 'translateX(83px)');
                }
            } else {
                $(e.target).siblings('.gallery-fs-nav').children('a, button').css('transform', 'translateX(0)');
            }
        }
        $('.gallery-fs-thumbnails').owlCarousel({
            onInitialized: setOwlNav,
            onResized: setOwlNav,
            loop: false,
            margin: 17,
            nav: true,
            navText: navText,
            rtl: ($('html[dir="rtl"]').length > 0),
            responsive: {
                0:    { items: 2 },
                782:  { items: 4 },
                1000: { items: thumbCol }
            },
        });

        $('.gallery-fs-thumbnails a').swipebox({
            hideBarsDelay: -1,
            afterOpen: function() {
                if (!openGallery) $.swipebox.close();
                openGallery = false;
            },
            nextSlide: function() {
                var index = $('.gallery-fs-thumbnails .owl-item a.selected').parent().index();
                if (index < $('.gallery-fs-thumbnails .owl-item').length - 1) {
                    changeThumb($('.gallery-fs-thumbnails .owl-item').eq(index + 1).children('a'));
                }
            },
            prevSlide: function() {
                var index = $('.gallery-fs-thumbnails .owl-item a.selected').parent().index();
                if (index > 0) {
                    changeThumb($('.gallery-fs-thumbnails .owl-item').eq(index - 1).children('a'));
                }
            }
        });

        $('.gallery-fs-thumbnails .owl-item a').on('click', function() {
            changeThumb($(this));
        });

        $('.gallery-fs-fullscreen').on('click', function(e) {
            e.preventDefault();
            openGallery = true;
            var $gallery = $(this).parents('.gallery-fs');
            if ($gallery.find('.gallery-fs-thumbnails').length) {
                $gallery.find('.gallery-fs-thumbnails .owl-item a.selected').eq(0).click();
            }
        });

        if (!$('.gallery-fs-thumbnails').length) {
            $('.gallery-fs-fullscreen').css({ 'right': '21px' });
            $('.gallery-fs-fullscreen').swipebox({ hideBarsDelay: 1 })
        }

        if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) $('.vc-hoverbox').attr('onclick', '');

        rightMenuMobilePosition()

        anpsLightbox()

        if ($('.footer-parallax').length) {
            isFixedFooter = true
            fixedFooter()
        }

        if ($('body').hasClass('home')) {
            var navLinkIDs = '';
            $('.site-navigation a[href*="#"]:not([href="#"]):not([href*="="])').each(function(index) {
                if (navLinkIDs != "") navLinkIDs += ", ";
                var temp = $('.site-navigation a[href*="#"]:not([href="#"]):not([href*="="])').eq(index).attr('href').split('#');
                navLinkIDs += '#' + temp[1];
            });
            if (navLinkIDs) {
                $(navLinkIDs).waypoint(function(direction) {
                    if (direction == 'down') {
                        $('.site-navigation a').parent().removeClass("current_page_item");
                        $('.site-navigation a[href="#' + $(this).attr('id') + '"]').parent().addClass('current_page_item');
                    }
                }, { offset: 125 });
                $(navLinkIDs).waypoint(function(direction) {
                    if (direction == 'up') {
                        $('.site-navigation a').parent().removeClass("current_page_item");
                        $('.site-navigation a[href="#' + $(this).attr('id') + '"]').parent().addClass("current_page_item");
                    }
                }, { offset: function() { return -$(this).height() + 20; } });
            }
        }

        isotopeLayout(window)

        if ($('.filter button').length) {
            $('.filter button').on('click', function() {
                $(this).parents('.filter').find('.selected').removeClass('selected');
                $(this).addClass('selected');
                // set filter in hash
                var newURL = replaceUrlParam(location.href, 'filter', $(this).attr('data-filter'));
                window.history.pushState('', '', newURL);
                if ($('.isotope[data-per-page]').length) {
                    $('.portfolio-pagination-selected').removeClass('portfolio-pagination-selected');
                    $('.portfolio-pagination-item:first-child').addClass('portfolio-pagination-selected');
                    $('.isotope').attr('data-page', '1');
                    portfolioAjax();
                } else {
                    isotopeLayout.call(this);
                }
            });
        }
    })

    window.addEventListener('load', function () {
        if (!isJqueryReady) return

        if (window.location.hash.length > 0) {
            var target = $(window.location.hash)

            if(!target.length) return

            setTimeout(function() {
                window.scrollTo(0, target.offset().top)
            }, 1)
        }
        if (isStickyHeader) {
            changeTopOffset()
            stickyHeader()
        }

        isotopeLayout(window)

        window.vc_prettyPhoto = anpsLightbox
        anpsLightbox()
    })

    window.addEventListener('resize', throttle(function () {
        if (!isJqueryReady) return

        submenuHeight()
        if (isStickyHeader) {
            changeTopOffset()
            stickyHeader()
        }

        if (window.innerWidth > 991) {
            $('.top-bar .container').attr('style', '');
            $('.top-bar').removeClass('top-bar-show top-bar-hide')
        } else if ($('.top-bar-show').length) {
            topBarSize();
        }

        if (isMegamenu) megamenu()

        if ($containerMasonry.length) $containerMasonry.isotope('layout')
        isotopeLayout(window)

        rightMenuMobilePosition()

        fixedFooter()
    }, 200), false)

    window.addEventListener('scroll', function () {
        if (!isJqueryReady) return

        window.requestAnimationFrame(function () {
            if (isStickyHeader) {
                changeTopOffset()
                stickyHeader()
            }
        })
    }, { passive: true })

    window.addEventListener('scroll', throttle(function () {
        if (!isJqueryReady) return

        checkForOnScreen()
        if (scrollTopEl) handleScrollTopLinkVisibility()
    }, 100), { passive: true })
})(jQuery)

if (typeof window['vc_rowBehaviour'] !== 'function') {
    window.vc_rowBehaviour = function() {
        var $ = window.jQuery;
        function fullWidthRow() {
            var $elements = $('[data-vc-full-width="true"]');
            $.each($elements, function(key, item) {
                /* Anpthemes */
                var verticalOffset = 0;
                if( $('.site-header-vertical-menu').length && window.innerWidth > 992 ) {
                    verticalOffset = $('.site-header-vertical-menu').innerWidth();
                }

                var boxedOffset = 0;
                if( $('body.boxed').length && window.innerWidth > 992 ) {
                    boxedOffset = ($('body').innerWidth() - $('.site-wrapper').innerWidth()) / 2;
                }

                var $el = $(this);
                $el.addClass("vc_hidden");
                var $el_full = $el.next(".vc_row-full-width");
                $el_full.length || ($el_full = $el.parent().next(".vc_row-full-width"));
                var el_margin_left = parseInt($el.css("margin-left"), 10)
                    , el_margin_right = parseInt($el.css("margin-right"), 10)
                    , offset = 0 - $el_full.offset().left - el_margin_left
                    , width = $(window).width() - verticalOffset - boxedOffset*2
                    , positionProperty = $('body.rtl').length ? 'right' : 'left';

                if( positionProperty === 'right' ) {
                    verticalOffset = 0;
                }

                var options = {
                    'position': 'relative',
                    'box-sizing': 'border-box',
                    'width': width
                };
                options[positionProperty] = offset + verticalOffset + boxedOffset;

                $el.css(options);

                if(!$el.data("vcStretchContent")) {
                    var padding = -1 * offset - verticalOffset - boxedOffset;
                    0 > padding && (padding = 0);
                    var paddingRight = width - padding - $el_full.width() + el_margin_left + el_margin_right;
                    0 > paddingRight && (paddingRight = 0),
                    $el.css({ "padding-left": padding + "px", "padding-right": paddingRight + "px" })
                }
                $el.attr("data-vc-full-width-init", "true"),
                $el.removeClass("vc_hidden")
            }),
            $(document).trigger("vc-full-width-row", $elements)
        }
        function parallaxRow() {
            var vcSkrollrOptions, callSkrollInit = !1;
            return window.vcParallaxSkroll && window.vcParallaxSkroll.destroy(),
                $(".vc_parallax-inner").remove(),
                $("[data-5p-top-bottom]").removeAttr("data-5p-top-bottom data-30p-top-bottom"),
                $("[data-vc-parallax]").each(function() {
                    var skrollrSpeed, skrollrSize, skrollrStart, skrollrEnd, $parallaxElement, parallaxImage, youtubeId;
                    callSkrollInit = !0,
                    "on" === $(this).data("vcParallaxOFade") && $(this).children().attr("data-5p-top-bottom", "opacity:0;").attr("data-30p-top-bottom", "opacity:1;"),
                    skrollrSize = 100 * $(this).data("vcParallax"),
                    $parallaxElement = $("<div />").addClass("vc_parallax-inner").appendTo($(this)),
                    $parallaxElement.height(skrollrSize + "%"),
                    parallaxImage = $(this).data("vcParallaxImage"),
                    youtubeId = vcExtractYoutubeId(parallaxImage),
                    youtubeId ? insertYoutubeVideoAsBackground($parallaxElement, youtubeId) : "undefined" != typeof parallaxImage && $parallaxElement.css("background-image", "url(" + parallaxImage + ")"),
                    skrollrSpeed = skrollrSize - 100,
                    skrollrStart = -skrollrSpeed,
                    skrollrEnd = 0,
                    $parallaxElement.attr("data-bottom-top", "top: " + skrollrStart + "%;").attr("data-top-bottom", "top: " + skrollrEnd + "%;")
                }),
            callSkrollInit && window.skrollr ? (vcSkrollrOptions = {
                forceHeight: !1,
                smoothScrolling: !1,
                mobileCheck: function() {
                    return !1
                }
            },
            window.vcParallaxSkroll = skrollr.init(vcSkrollrOptions),
            window.vcParallaxSkroll) : !1
        }
        function fullHeightRow() {
            var $element = $(".vc_row-o-full-height:first");
            if ($element.length) {
                var $window, windowHeight, offsetTop, fullHeight;
                $window = $(window),
                windowHeight = $window.height(),
                offsetTop = $element.offset().top,
                windowHeight > offsetTop && (fullHeight = 100 - offsetTop / (windowHeight / 100),
                $element.css("min-height", fullHeight + "vh"))
            }
            $(document).trigger("vc-full-height-row", $element)
        }
        $(window).off("resize.vcRowBehaviour").on("resize.vcRowBehaviour", fullWidthRow).on("resize.vcRowBehaviour", fullHeightRow),
        fullWidthRow(),
        fullHeightRow(),
        vc_initVideoBackgrounds(),
        parallaxRow()
    }
}
