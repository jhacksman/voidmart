// store the current selection for details page and printing
let details = {
    name: '',
    desc: '',
    url: ''
}

// simple nav that just adds/removes a class per .page element
function goto(pageToShow) {
    console.log(pageToShow)
    $('.page').each((index, el) => {
        console.log(el)
        $(el).removeClass('show')
    })
    $(pageToShow).addClass('show')
}

function getActivePageClass() {
    const active = document.querySelector('.page.show')
    if (!active) return null
    // return the first class that isn't 'page' or 'show'
    const cls = Array.from(active.classList).filter(c => c !== 'page' && c !== 'show')
    return cls[0] || null
}

// fill in the elements on the details page, store them above
function fillDetails(name, desc, url) {
    console.log(name, desc)
    details.name = name
    details.desc = desc
    details.url = url
    $('.detail .body .title').text(name)
    $('.detail .body .desc').text(desc)
    $('.detail .img img').attr('src', url)
}

function sendPrint() {
    $.post('/printit', details)
}

// refresh the page after thank you screen
function resetPage (delay) {
    setTimeout(() => {
        window.location.reload()
    }, delay)
}

// reset the page if no interactions happen
function idleTimer() {
    function onIdle() {
        const active = getActivePageClass()
        // For secret/mode screens, prefer returning to landing without a hard reload.
        if (active === 'modeMenu' || active === 'ctrlh' || active === 'ctrlhForm' || active === 'ctrlhThanks') {
            goto('.landing')
            return
        }
        window.location.reload()
    }
    let t
    function resetTimer() {
        clearTimeout(t)
        t = setTimeout(onIdle, window.REFRESH_TIMER || 60000)
    } 

    window.addEventListener('mousemove', resetTimer, true)
    window.addEventListener('mousedown', resetTimer, true)
    window.addEventListener('touchstart', resetTimer, true)
    window.addEventListener('touchmove', resetTimer, true)
    window.addEventListener('click', resetTimer, true)
    window.addEventListener('scroll', resetTimer, true)
    window.addEventListener('wheel', resetTimer, true)

    // start the timer immediately
    resetTimer()
}

// setup the sig pad on the checkout screen
let padCanvas, signaturePad;

// CTRLH ticket state
let ctrlh = {
    kind: null,
    title: null,
    timestamp: null,
}

function ctrlhSelect(kind) {
    const now = new Date()
    ctrlh.kind = kind
    ctrlh.timestamp = now.toISOString()
    const titles = {
        parking_permit: 'Parking Permit',
        parking_ticket: 'Parking Ticket',
        broken_stuff: 'Broken Stuff Ticket',
    }
    ctrlh.title = titles[kind] || 'CTRLH Ticket'

    $('.ctrlhForm .ctrlhTitle').text(ctrlh.title)
    $('.ctrlhForm .timestamp').text(now.toLocaleString())
    $('.ctrlhForm textarea.note').val('')

    goto('.ctrlhForm')
}

function ctrlhPrint() {
    const note = $('.ctrlhForm textarea.note').val() || ''
    $.post('/ctrlh/print', {
        kind: ctrlh.kind,
        title: ctrlh.title,
        timestamp: ctrlh.timestamp,
        note,
    })
    .always(() => {
        goto('.ctrlhThanks')
        // soft return to landing after a short delay (no hard reload)
        setTimeout(() => goto('.landing'), 5000)
    })
}

$(document).ready(() => {
    padCanvas = document.querySelector(".pad")
    signaturePad = new SignaturePad(padCanvas, {
        minWidth: 1,
        maxWidth: 6,
    })

    // Landing interactions:
    // - normal tap anywhere -> browse
    // - secret taps in bottom-left square -> unlock mode menu
    let tapTimes = []
    const requiredTaps = 10
    const windowMs = 5000

    function isLandingActive() {
        return document.querySelector('.page.landing.show') !== null
    }

    function inSecretRegion(clientX, clientY) {
        const S = Math.round(window.innerHeight / 16)
        // bottom-left square: x in [0,S], y in [innerHeight-S, innerHeight]
        return (clientX <= S) && (clientY >= (window.innerHeight - S))
    }

    function recordSecretTap() {
        const now = Date.now()
        tapTimes = tapTimes.filter(t => (now - t) <= windowMs)
        tapTimes.push(now)
        if (tapTimes.length >= requiredTaps) {
            tapTimes = []
            goto('.modeMenu')
        }
    }

    function landingTapHandler(ev) {
        if (!isLandingActive()) return

        // support touch + mouse
        let x, y
        if (ev.touches && ev.touches.length) {
            x = ev.touches[0].clientX
            y = ev.touches[0].clientY
        } else {
            x = ev.clientX
            y = ev.clientY
        }

        if (inSecretRegion(x, y)) {
            // keep the landing screen visible while tapping; do not navigate
            ev.preventDefault()
            ev.stopPropagation()
            recordSecretTap()
            return
        }

        // normal flow
        goto('.browse')
    }

    const landing = document.querySelector('.page.landing')
    if (landing) {
        landing.addEventListener('touchstart', landingTapHandler, { passive: false })
        landing.addEventListener('mousedown', landingTapHandler)
        landing.addEventListener('click', (ev) => {
            // clicks can fire after touch; only handle when landing is active.
            // If it was a secret-region tap, it was already handled + stopped.
            if (!isLandingActive()) return
            landingTapHandler(ev)
        })
    }
})


idleTimer()

// turn off annoying stuff when you are in dev mode
if (window.DEV !== "dev") {

    // kill right click
    document.addEventListener('contextmenu', ev => ev.preventDefault())
    
    window.onload = function() {
        if (window.ENABLE_GLITCH === 'true') {
            var gl = Object.create(glitch_exec)
            gl.start(document.body)
        }
    }
}