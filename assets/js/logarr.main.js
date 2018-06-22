// Logarr main JS script
// https://github.com/Monitorr

// Variables
let results, currentIndex = 0;


// Set sytles for BlockUI overlays in /assets/js/jquery.blockUI.js
function refreshblockUI() {
    $.growlUI('Updating logs...');
    setTimeout(function () {
        refresh();
    }, 300);

    //wait after log update to highlight error terms:
    if (settings.autoHighlight == "true") {
        setTimeout(function () {
            highlightjs();
        }, 1500); // CHANGE ME ??
    }
    //wait after log update, if the searchinput field is not empty, perform search:
    if ($("input[name='markinput']").val() != "") {
        setTimeout(function () {
            mark();
            //$("button[data-search='search']").click();
        }, 1500); // CHANGE ME ??
    }
}

function refresh() {
    loadLog();
    console.log('Logarr log update START');
}

// Load logs
function loadLog() {
    $.ajax({
        url: "assets/php/load-log.php",
        data: {'hash': window.location.hash},
        type: "POST",
        success: function (response) {
            //$('#logcontainer').fadeOut('slow').delay(500);
            $('#logcontainer').html(response);
            $('#logwrapper').fadeIn('slow');
            console.log('Loaded logs');
        }
    });
}

// highlight all "error" terms:
function highlightjs() {
    if('customHighlightTerms' in settings && settings.customHighlightTerms != "") {
        var array = settings.customHighlightTerms.split(",");
        for (let i = 0; i < array.length; i++) {
            $(".expand").highlight(array[i].trim(), {
                element: 'em',
                className: array[i].trim()
            });
            console.log("Highlighting text containing: " + array[i].trim());
        }
    }
}

// Jumps to the element matching the currentIndex
function jumpTo() {
    if (results.length) {
        let position,
            $current = results.eq(currentIndex);
        results.removeClass("current");
        if ($current.length) {
            $current.addClass("current");
            let currentMarkResult = $('.markresults.current');
            let parent = currentMarkResult.parent();
            while (!parent.is('div')) {
                parent = parent.parent();
            }

            /* not animated page scroll */
            $('html, body').scrollTop(
                $(parent).offset().top
            );

            /*
                $('html, body').animate({
                    scrollTop: $(parent).offset().top
                }, 200); //make this value bigger if you want smoother/longer scroll
            */

            /* not animated scroll */
            parent.scrollTop(
                currentMarkResult.offset().top - parent.offset().top + parent.scrollTop()
            );
        }
    }
}

// Marks search results
function mark() {

    // Read the keyword
    let keyword = $("input[name='markinput']").val();
    let content = $(".slide");

    // Determine selected options

    // Mark the keyword inside the context:

    content.unmark({
        done: function () {
            content.mark(keyword, {
                separateWordSearch: false,
                done: function () {
                    results = content.find("mark");
                    let count = $(".count");
                    count.text(results.length);
                    count.append(" occurance(s) of: '");
                    count.append(keyword);
                    count.append("'");
                    results.addClass("markresults");
                    count.addClass("countresults");
                    currentIndex = 0;
                    if (settings.jumpOnSearch) jumpTo(); // Auto focus/scroll to first searched term after search submit, if user had enabled option in config
                }
            });
        }
    });
}

// on page ready functions
$(function () {
    // Perform search action on click
    $("button[data-search='search']").on("click", function () {
        console.log('Logarr is performing search');
        $('#buttonStart :checkbox').prop('checked', false).change(); // if auto-update is enabled, disable it after search submit
        $.blockUI({
            message: 'Searching...'
        });
        setTimeout(function () {
            $('.btn-visible').removeClass("btn-hidden"); // unhide next/previous buttons on search
            mark();
            $.unblockUI()
        }, 300);
    });

    // Perform search action on enter
    $("#text-search2").keyup(function (event) {
        if (event.keyCode === 13) {
            console.log('Logarr is performing search');
            $('#buttonStart :checkbox').prop('checked', false).change(); // if auto-update is enabled, disable it after search submit
            $.blockUI({
                message: 'Searching...'
            });
            setTimeout(function () {
                $('.btn-visible').removeClass("btn-hidden"); // unhide next/previous buttons on search
                mark();
                $.unblockUI()
            }, 300);
        }
    });

    // Clears the search
    $("button[data-search='clear']").on("click", function () {
        console.log('Logarr cleared search results');
        $.growlUI('Clearing <br> search results');
        $(".slide").unmark();
        $("input[name='markinput']").val("");
        $('.count').removeClass("countresults");
        $('.btn-visible').addClass("btn-hidden");
    });

    // Next and previous search jump to
    $("button[data-search='next']").add($("button[data-search='prev']")).on("click", function () {
        if (results.length) {
            currentIndex += $(this).is($("button[data-search='prev']")) ? -1 : 1;
            if (currentIndex < 0) {
                currentIndex = results.length - 1;
            }
            if (currentIndex > results.length - 1) {
                currentIndex = 0;
            }
            jumpTo();
        }
    });

    // Live search as soon as user keyup in search field:
    let timeoutID = null;
    $("input[name='markinput']").keyup(function (e) {
        clearTimeout(timeoutID);
        if (settings.liveSearch == "true") {
            $('.btn-visible').removeClass("btn-hidden"); // unhide next/previous buttons on search
            timeoutID = setTimeout(() => mark(e.target.value), 500);
        }
    });

    // unlink log action
    $(document).on('click', "button[data-action='unlink-log']", function (event) {
        alert('test');
        event.preventDefault(); // stop being refreshed
        console.log('Attempting log roll');
        $.growlUI("Attempting <br> log roll");
        $.ajax({
            type: 'POST',
            url: 'assets/php/unlink.php',
            processData: false,
            data: "file=" + $(".path[data-service='" + $(this).data('service') + "']").html().trim(),
            success: function (data) {
                $('#modalContent').html(data);
                let modal = $('#responseModal');
                let span = $('.closemodal');
                modal.fadeIn('slow');
                span.click(function () {
                    modal.fadeOut('slow');
                });
                $(body).click(function (event) {
                    if (event.target != modal) {
                        modal.fadeOut('slow');
                    }
                });
                setTimeout(function () {
                    modal.fadeOut('slow');
                }, 3000);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("ERROR: unlink ajax posting failed");
            }
        });
        return false;
    });

    // download log action
    $(document).on('click', "button[data-action='download-log']", function (event) {
        event.preventDefault(); // stop page from being refreshed
        $.growlUI("Downloading <br> log file");
        let logFilePath = ($(".path[data-service='" + $(this).data('service') + "']").html()).replace('file=', '').trim();
        console.log("Downloading log file: " + logFilePath);
        window.open('assets/php/download.php?file=' + logFilePath);
        return false;
    });

    // filter logs
    $(document).on('click', ".category-filter-item", function (event) {
        refreshblockUI();
        setTimeout(function () {
            console.log('Filtering logs on: ' + window.location.hash);
        }, 500);
    });
});

function refreshConfig(updateLogs) {
    $.ajax({
        url: "assets/php/sync-config.php",
        data: {settings: settings, preferences: preferences},
        type: "POST",
        success: function (response) {

            let json = JSON.parse(response);
            let settings = json.settings;
            let preferences = json.preferences;

            setTimeout(function () {
                refreshConfig()
            }, settings.rfconfig); //delay is rftime


            $("#auto-update-status").attr("data-enabled",settings.logRefresh);

            if(updateLogs) {
                if (settings.logRefresh == "true" && (logInterval == false || settings.rflog != current_rflog)) {
                    clearInterval(nIntervId);
                    nIntervId = setInterval(refreshblockUI, settings.rflog);
                    logInterval = true;
                    $("#autoUpdateSlider").attr("data-enabled", "true");
                    current_rflog = settings.rflog;
                    console.log("Auto update: Enabled | Interval: " + settings.rflog + " ms");
                    $.growlUI("Auto update: Enabled");
                } else if (settings.logRefresh == "false" && logInterval == true) {
                    clearInterval(nIntervId);
                    logInterval = false;
                    $("#autoUpdateSlider").attr("data-enabled", "false");
                    console.log("Auto update: Disabled");
                    $.growlUI("Auto update: Disabled");
                }
            }

            document.title = preferences.sitetitle; //update page title to configured title
            console.log('Refreshed config variables');
        }
    });
}

function overwriteLogUpdate() {

    if(!autoUpdateOverwrite) {
        console.log("Auto update setting will only be updated from config when the page is refreshed");
    }

    if($("#autoUpdateSlider").attr("data-enabled") == "false") {
        autoUpdateOverwrite = true;
        $("#autoUpdateSlider").attr("data-enabled", "true");

        clearInterval(nIntervId);
        nIntervId = setInterval(refreshblockUI, settings.rflog);
        logInterval = true;

        console.log("Auto update: Enabled | Interval: " + settings.rflog + " ms");
        $.growlUI("Auto update: Enabled");
    } else {
        autoUpdateOverwrite = true;
        $("#autoUpdateSlider").attr("data-enabled", "false");

        clearInterval(nIntervId);
        logInterval = false;

        console.log("Auto update: Disabled");
        $.growlUI("Auto update: Disabled");
    }
}

function updateTime() {
    setInterval(function () {
        let timeString = date.toLocaleString('en-US', {
            hour12: timeStandard,
            weekday: 'short',
            year: 'numeric',
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).toString();
        let res = timeString.split(",");
        let time = res[3];
        let dateString = res[0] + '&nbsp; | &nbsp;' + res[1].split(" ")[2] + " " + res[1].split(" ")[1] + '<br>' + res[2];
        let data = '<div class="dtg">' + time + ' ' + timeZone + '</div>';
        data += '<div id="line">__________</div>';
        data += '<div class="date">' + dateString + '</div>';
        $("#timer").html(data);
    }, 1000);
}

function syncServerTime() {
    console.log('Logarr time update START | Interval: ' + settings.rftime + ' ms');
    $.ajax({
        url: "assets/php/time.php",
        type: "GET",
        success: function (response) {
            var response = $.parseJSON(response);
            servertime = response.serverTime;
            timeStandard = parseInt(response.timeStandard);
            timeZone = response.timezoneSuffix;
            rftime = response.rftime;
            date = new Date(servertime);
            setTimeout(function () {
                syncServerTime()
            }, settings.rftime); //delay is rftime
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('Logarr time update START');
        }
    });
}

function load_info() {
    document.getElementById("setttings-page-title").innerHTML = 'Information';
    document.getElementById("includedContent").innerHTML = '<object  type="text/html" class="object" data="assets/php/settings/info.php" ></object>';
    $(".sidebar-nav-item").removeClass('active');
    $("li[data-item='info']").addClass("active");
}

function load_preferences() {
    document.getElementById("setttings-page-title").innerHTML = 'User Preferences';
    document.getElementById("includedContent").innerHTML = '<object type="text/html" class="object" data="assets/php/settings/user_preferences.php" ></object>';
    $(".sidebar-nav-item").removeClass('active');
    $("li[data-item='user-preferences']").addClass("active");
}

function load_settings() {
   document.getElementById("setttings-page-title").innerHTML = 'Logarr Settings';
    document.getElementById("includedContent").innerHTML = '<object type="text/html" class="object" data="assets/php/settings/site_settings.php" ></object>';
    $(".sidebar-nav-item").removeClass('active');
    $("li[data-item='logarr-settings']").addClass("active");
}

function load_authentication() {
    document.getElementById("setttings-page-title").innerHTML = 'Logarr Authentication';
    document.getElementById("includedContent").innerHTML = '<object type="text/html" class="object" data="assets/php/settings/authentication.php" ></object>';
    $(".sidebar-nav-item").removeClass('active');
    $("li[data-item='logarr-authentication']").addClass("active");
}

function load_logs() {
    document.getElementById("setttings-page-title").innerHTML = 'Logs Settings';
    document.getElementById("includedContent").innerHTML = '<object type="text/html" class="object" data="assets/php/settings/logs_settings.php" ></object>';
    $(".sidebar-nav-item").removeClass('active');
    $("li[data-item='logs-configuration']").addClass("active");
}

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        document.getElementById("myBtn").style.display = "block";
    } else {
        document.getElementById("myBtn").style.display = "none";
    }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

function checkedAll(isChecked) {
    var c = document.getElementsByName('slidebox');

    for (var i = 0; i < c.length; i++) {
        if (c[i].type == 'checkbox') {
            c[i].checked = isChecked;
        }
    }
}

function checkAll1() {
    checkedAll(true);
}