var auto_increment = 0;
var stories = {};
var last_link = "";
var loading = true;

// Animating images
animate_logo("logo", "design/logo_small_xx.png", 4, 200);
animate_logo("share-notation", "design/share_x.png", 2, 250);

window.onload = () => {
    load_template_options();
    preload_story();
    loading = true;
    if (Object.keys(stories).length == 0) add_story(undefined, undefined, true);
    loading = false;
};

window.onpopstate = e => {
    preload_story();
};

/**
 *
 * @param {*} target ID of the logo image
 * @param {*} path Path to the images (x represent increasing number from 0 - length-1) The path cannot include x's.
 * @param {*} length Amount of images
 * @param {*} speed ms between each frame
 */
function animate_logo(target, path, length, speed = 200) {
    var target = document.getElementById(target);
    var images = [];

    var first_x = path.indexOf("x");
    var last_x = path.lastIndexOf("x") + 1;
    var x_length = last_x - first_x;
    var pre = path.substr(0, first_x);
    var post = path.substr(last_x);

    for (var i = 0; i < length; i++) {
        var img = new Image();
        img.src = pre + force_length(i, x_length) + post;
        images.push(img);
    }

    function force_length(value, length) {
        while (String(value).length < length) value = "0" + String(value);
        return value;
    }

    var index = 0;
    var loop = setInterval(() => {
        target.src = images[index++ % length].src;
    }, speed);

    return loop;
}

String.prototype.pixelLength = function() {
    var ruler = document.getElementById("ruler");
    ruler.innerHTML = this;
    return ruler.offsetWidth;
};

String.prototype.nthIndex = function(pat, n) {
    n++;
    var L = this.length,
        i = -1;
    while (n-- && i++ < L) {
        i = this.indexOf(pat, i);
        if (i < 0) break;
    }
    return i;
};

function preload_story() {
    loading = true;
    stories = {};
    document.getElementById("stories").innerHTML = "";

    var search = location.search;
    if (search) {
        var s = search.substr(search.indexOf("s=") + 2);
        s = decodeURIComponent(s);
        s = atob(s);
        s = JSON.parse(s);

        for (var key in s) {
            var story = s[key];
            add_story(story.key, story.input);
        }
    }
}

function add_story(template = undefined, inputs = []) {
    loading = true;
    var el = document.getElementById("stories");
    if (!template) template = document.getElementById("choose-template").value;
    var story = generate_story(templates[template], inputs);
    el.appendChild(story);
    loading = false;
}

function generate_link() {
    if (Object.keys(stories).length == 0) return location.origin;
    var compressed = encodeURIComponent(btoa(JSON.stringify(stories)));
    return location.origin + "?s=" + compressed;
}

function update_copy_button(text = "Copy link", color = "rgb(243, 243, 243)") {
    var button = document.getElementById("copy-link-button");
    button.style.background = color;
    button.innerText = text;
}

function load_template_options() {
    var select = document.getElementById("choose-template");
    for (key in templates) {
        select.innerHTML += `<option value='${key}'>${key}</option>`;
    }
}

function copy_link() {
    update_copy_button("Copied!", "#82e868");
    navigator.clipboard.writeText(generate_link());
}

function update_story(el, prevent_push = false) {
    var index = el.getAttribute("input-index");
    var story = stories[el.getAttribute("story-id")];
    var template = templates[story.key].text;
    var start = template.nthIndex("{", index) + 1;
    var stop = template.indexOf("}", start);
    var original_word = template.substr(start, stop - start);
    var updated = original_word.toLowerCase() != el.value.toLowerCase();
    story.input[index] = el.value;
    el.style.borderColor = !updated || !el.value ? "var(--pr)" : "#64d453";

    el = set_width(el);
    var link = generate_link();
    document.getElementById("story-link").value = link;

    if (!prevent_push && last_link != link) {
        last_link = link;
        push_history();
    }
    update_copy_button();
}

function push_history() {
    window.history.pushState(null, "", generate_link());
}

function set_width(el) {
    el.style.width = el.value.pixelLength() + 15 + "px";
    return el;
}

function generate_story(template = templates["Som en roll"], inputs = [], prevent_push = false) {
    //<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
    // Setup story element
    var story = document.createElement("div");
    story.classList.add("story");
    var id = `story_${auto_increment++}`;
    // Index of editable word in the story
    var input_index = 0;
    // Insert new exert into global stories
    stories[id] = {
        key: template.key,
        input: []
    };
    // Define tempalate as the text of the template (this only throws out the key property)
    template = template.text;

    // Loop through the template text and parse it properly
    for (var i = 0; i < template.length; i++) {
        // Grab the current letter in the loop
        var letter = template[i];
        // If the letter is a start of an editable word, handle it!
        if (letter == "{") {
            // Prepare the input field that will be the editable word
            var input_field = document.createElement("input");
            // Definie where the editable word stops in the comeplete template text
            var stop = template.indexOf("}", i);
            // Grab the word in its entirety without brackets from the text
            // If inputs for this word is definied, instead put that in the value
            // ... This is for when loading a story.
            var value = inputs[input_index]
                ? inputs[input_index]
                : template.substr(i + 1, stop - i - 1);

            // Prepare the input field
            input_field.setAttribute("story-id", id);
            input_field.setAttribute("value", value);
            input_field.setAttribute("input-index", input_index);
            input_field.setAttribute("oninput", "update_story(this)");
            input_field.classList.add("story-input");
            input_field.type = "text";

            // Resize and prepare the input field for deployment
            update_story(input_field, prevent_push);
            // Append element in the story
            story.appendChild(input_field);
            // Update the global stories with the user input value
            stories[id].input[input_index] = value;
            // Increase the input index and jump the i increment to beyond this word.
            input_index++;
            i += stop - i;
        } else {
            // No editable word, just append the letter and move on.
            story.innerHTML += letter;
        }
    }

    return story;
}
