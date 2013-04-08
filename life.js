var cLife = cLife || { };

(function() {

var w = 500;
// var sc = 255.0/w;
var r = 10;
// var max = Math.floor(w/r);

var max_y = 50;
var max_x = 50;

var sc = 255.0/max_x;

var applyThreshold = 1;
var _or = 0;
var adjust = 1;
var luminosity = 1;
var Ylim = 127; // 127
var slimit = 1; // 1 = set life/death change to threshold value, 0 = set life/death change to degree (eg really alive -> little bit dead)

var black = {r:0, g:0, b:0};
var white = {r:255, g:255, b:255};

var Yr = 76;    // 0.3  * 255
var Yg = 150;   // 0.59 * 255
var Yb = 28;    // 0.11 * 255

// d is distance from edge that defines the computable boundary within which to apply f
function generation(oldarray, f, d) {
    var ya;  // y array
    var x,y;

    var blocks = new Array(max_y);

    for (y=0; y < max_y; y++) {

        ya = new Array(max_x);
        for (x=0; x < max_x; x++) {

            // if (x > d && x < max_x - d && y > d && y < max_y - d)
                ya[x] = f(x, y, oldarray);
            // else {
            //     if (oldarray)
            //         ya[x] = oldarray[x];
            //     else
            //         ya[x] = black;
            // }
        }
        blocks[y] = ya;
    }
    return blocks;
}

// {{{jitter a color value
var fr = function(x) {
    var m = (Math.random() * 10) - 5;

    m += x;

    if (m < 0) m = 0;
    else if (m > 255) m = 255;

    return Math.floor(m);
}; // }}}

var brand = function(x, y, oldarray) {

    // if (x % 5 == 0)
    //     return { r: 0, g: 0, b: 0 };
    // else
        return {
            r: Math.floor(Math.random() * 255),
            g: Math.floor(Math.random() * 255),
            b: Math.floor(Math.random() * 255)

            // r: fr(sc*x),
            // g: fr(sc*y),
            // b: fr(127)

            // b: fr(sc*(x+y)/2)
        };
};

var Y = function(o) {
    return 0.3 * o.r + 0.59 * o.g + 0.11 * o.b;
};

var _yx = function(x, s) {
    x *= s;
    if (x < 0) return 0;
    if (x > 255) return 255;
    return Math.floor(x);
};

var Yup_neutral = function(o) {
    return {
        r: _yx(o.r, 1.03),
        g: _yx(o.g, 1.059),
        b: _yx(o.b, 1.011)
    };
};

var Ydown_neutral = function(o) {
    return {
        r: _yx(o.r, 0.97),
        g: _yx(o.g, 0.941),
        b: _yx(o.b, 0.989)
    };
};

var blife = function(x,y, a) {
    // search x-1, y-1  to x+1, y+1

    var n = 0; // neighbors
    var v = a[y][x];
    var vy = Y(v);

    var Yup = function(o) {
        var _yup= function(x, scale) { // assume 0 < s < 1

            var xi = x * scale;
            
            if (xi > 200)
                xi = fr(xi * 0.9);

            if (applyThreshold  && xi < 127) {
                xi = slimit? 127 : 255 - xi;
            }

            if (xi > 255)
                xi = fr(250);
            
            if (_or)
                xi |= Math.floor(Math.random() * x);

            return Math.floor(xi);
        };
        // return white;
        return {
            r: _yup(o.r, 1.03),
            g: _yup(o.g, 1.059),
            b: _yup(o.b, 1.011)
        };
    };


    var Ydown = function(o) {
        var _ydown = function(x, scale) { // assume 0 < s < 1

            var xi = x * scale;
            if (xi < 100)
                xi = fr(xi * 1.1);

            if (applyThreshold && xi > 126) { // Ylim
                xi = slimit? 126 : 255 - xi;
            }

            if (xi < 5)
                xi = fr(xi);

            if (_or)
                xi |= x;

            return Math.floor(xi);
        };

        // return black;
        return {
            r: _ydown(o.r, 0.97),
            g: _ydown(o.g, 0.941),
            b: _ydown(o.b, 0.989)
        }
    };

    // luminosity sum
    var is_dark = function (o) {
        // return ( 0.3 * o.r + 0.59 * o.g + 0.11 * o.b) < Math.random() * 255;
        // return vy < Ylim;
        return ( 0.3 * o.r + 0.59 * o.g + 0.11 * o.b) < 127;
    };

    var alive;
    var nextstatus;

    var dk = function(n) {
        return Math.floor(0.9 * n);
        // return 100;
    }
    var lt = function(n) {
        var t= 1.1 * n;
        return Math.floor(t > 255.0 ? 255 : 1.1 * n );
    }

    alive = is_dark(v);

    n += is_dark(a[(y - 1 + max_y) % max_y][(x - 1 + max_x) % max_x]);
    n += is_dark(a[(y - 1 + max_y) % max_y][ x                     ]);
    n += is_dark(a[(y - 1 + max_y) % max_y][(x + 1 + max_x) % max_x]);

    n += is_dark(a[ y                     ][(x - 1 + max_x) % max_x]);
    n += is_dark(a[ y                     ][(x + 1 + max_x) % max_x]);

    n += is_dark(a[(y + 1 + max_y) % max_y][(x - 1 + max_x) % max_x]);
    n += is_dark(a[(y + 1 + max_y) % max_y][ x                     ]);
    n += is_dark(a[(y + 1 + max_y) % max_y][(x + 1 + max_x) % max_x]);

    // nextstatus = (n > 0 && n < 4);

    if (!alive && n == 3)
        nextstatus = 1;
    else if (alive && n == 2 || n == 3) {
        nextstatus = 1;
    }
    else nextstatus = 0;

    // adjust neutral colors regardless of life status
    if (adjust) {
        if (vy < 100)
            v = Ydown_neutral(v);
        else if (vy > 140)
            v = Yup_neutral(v);
    }
    

    if (luminosity)
        return nextstatus? Ydown(v) : Yup(v);

    // return nextstatus? {r:dk(v.r), g:dk(v.g), b:dk(v.b)}
    //      : { r:lt(v.r), g:lt(v.g), b:lt(v.b)};

    return nextstatus ? Ydown_neutral(v) : Yup_neutral(v);
}


// {{{ draw
function draw(gen) {

    var canvas = document.getElementById('canvas');


    var ctx = canvas.getContext("2d");
    var m = 20;
    var r= 10;
    var x,y;

    var rad = Math.PI * 2 / w;

    var rgb = function (bl) {
        return "rgb(" + bl.r + "," + bl.g + "," + bl.b + ")";
    };

    for (y=0; y < max_y; y++) {
        var b;

        for (x=0; x < max_x; x++) {
            ctx.fillStyle = rgb(gen[y][x]);
            ctx.fillRect(x*r, y*r, r, r); //m, m
        }
    }
}
// }}}

// {{{start
var mytimer;
var prevarray;
var newarray;

cLife.start = function(reset) {
    console.log("start");

    if (reset) {
        // randomize the initial array with the brand() function
        prevarray = generation(null, brand, 0);
        draw(prevarray);
    }

    if (mytimer)
        window.clearInterval(mytimer);

    mytimer = window.setInterval(function() {
        newarray = generation(prevarray, blife, 1);
        // newarray = generation(prevarray, brand);
        draw(newarray);
        prevarray = newarray;
    }, 50);
};

cLife.stop = function () {
    console.log("stop");
    window.clearInterval(mytimer);
};

})();

// }}}
