var auto_increment = 0;
var stories = {};
var last_link = "";

// Animating images
animate_image("logo", "design/logo_small_black_xx.png", 3, 200);
animate_image("share-notation", "design/share_x.png", 2, 250);
animate_image('github', 'design/github_x.png', 3)
animate_image('reset', 'design/reset_x.png', 3)

document.getElementById('logo-link').href = get_origin_url()
document.getElementById('reset-link').href = get_origin_url()


window.onload = () => {
    load_template_options();
    preload_story();
    if (Object.keys(stories).length == 0) add_story(undefined, undefined, true);
    var first_input = document.getElementsByClassName('story-input')[0]
    first_input.focus()
    first_input.setSelectionRange(0, first_input.value.length)
};

document.fonts.onloadingdone = () => {
    for (var el of document.getElementsByClassName("story-input"))
        update_story(el);
};

window.onpopstate = e => {
    preload_story();
};

String.prototype.pixelLength = function () {
    var ruler = document.getElementById("ruler");
    ruler.innerHTML = this;
    return ruler.offsetWidth;
};

String.prototype.nthIndex = function (pat, n) {
    n++;
    var L = this.length,
        i = -1;
    while (n-- && i++ < L) {
        i = this.indexOf(pat, i);
        if (i < 0) break;
    }
    return i;
};

/**
 *
 * @param {*} target ID of the logo image
 * @param {*} path Path to the images (x represent increasing number from 0 - length-1) The path cannot include x's.
 * @param {*} length Amount of images
 * @param {*} speed ms between each frame
 */
function animate_image(target, path, length, speed = 200) {
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

    var index = Math.floor(Math.random()*length-1);
    var loop = setInterval(() => {
        try{
            target.src = images[index++ % length].src;
        } catch(e){}
    }, speed);

    return loop;
}

var keys_down = [];
document.addEventListener("keydown", e => {
    keys_down[e.keyCode] = true;
    if (keys_down[17] && keys_down[90]) history.back();
    if(e.key == 'Enter') copy_link()
});
document.addEventListener("keyup", e => {
    keys_down[e.keyCode] = false;
});

function preload_story() {
    loading = true;
    stories = {};
    document.getElementById("stories").innerHTML = "";

    var search = location.search;

    if (search) {
        var start = search.indexOf("s=");
        var stop = search.indexOf("&", start);

        var s = search.substr(
            search.indexOf("s=") + 2,
            (stop != -1 ? stop : search.length) - start - 2
        );

        if (search.indexOf("t=") != -1) {
            var custom_templates = search.substr(search.indexOf("t=") + 2);
            custom_templates = decodeURIComponent(custom_templates);
            custom_templates = atob(custom_templates);
            custom_templates = JSON.parse(custom_templates);
            for (var template of custom_templates) {
                add_custom_template(template);
            }
        }

        s = decodeURIComponent(s);
        s = atob(s);
        s = JSON.parse(s);

        for (var key in s) {
            var story = s[key];
            add_story(story.key, story.input);
        }
    }
}

function add_custom_template(string) {
    var key =
        string
        .substr(0, 10)
        .split("{")
        .join("")
        .split("}")
        .join("") + "...";
    templates[key] = {
        key: key,
        text: string,
        custom: true
    };
    load_template_options();
}

function user_add_story(el) {
    var value = el.value;
    el.value = null;
    if (value == "CREATE_CUSTOM_STORY") {
        var template = prompt(
            "Enter your story template here. For every word you want to be editable surround it with curcly brackes. Exmaple: A word that is {editable}!"
        );
        if (template && template.length >= 10) {
            add_custom_template(template);
            update_link();
        } else {
            alert("Story is too short.");
        }
    } else {
        add_story(value);
    }
    push_history();
}

function add_story(template = undefined, inputs = []) {
    var el = document.getElementById("stories");
    if (!template) template = document.getElementById("choose-template").value;
    generate_story(templates[template], inputs);
}

function update_link() {
    document.getElementById("story-link").value = generate_link();
}

function generate_link() {
    var custom_templates = [];
    for (var key in templates)
        if (templates[key].custom) custom_templates.push(templates[key].text);
    var c_templates =
        custom_templates.length > 0 ?
        encodeURIComponent(btoa(JSON.stringify(custom_templates))) :
        false;
    var c_stories = encodeURIComponent(btoa(JSON.stringify(stories)));
    return (
        get_origin_url() + 
        "?s=" +
        c_stories +
        (c_templates ? "&t=" + c_templates : "")
    );
}

function update_copy_button(text = "Copy link", color = "rgb(255, 255, 255)") {
    var button = document.getElementById("copy-link-button");
    button.style.background = color;
    button.innerText = text;
}

function load_template_options() {
    var select = document.getElementById("choose-template");
    select.innerHTML = `<option value=null>Add story</option>`;
    for (key in templates) {
        select.innerHTML += `<option value='${key}'>* ${key}</option>`;
    }
    select.innerHTML += `<option value='CREATE_CUSTOM_STORY'>Create your own template</option>`;
}

function copy_link() {
    update_copy_button("Copied!", "#6bcc60");
    navigator.clipboard.writeText(generate_link());
}

function update_story(el, push = false) {
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

    if (last_link != link && push) {
        last_link = link;
        push_history();
    }
    update_copy_button();
}

function push_history() {
    window.history.pushState(null, "", generate_link());
    console.log("PUSHED");
}

function set_width(el) {
    el.style.width = el.value.pixelLength() + 15 + "px";
    return el;
}

function delete_story(el){
    var story_id = el.getAttribute('story-id')
    delete stories[story_id]
    document.getElementById(story_id).remove()
    update_link()
    push_history()
}

function generate_story(
    template = templates["Som en roll"],
    inputs = [],
    prevent_push = false
) {
    // Setup story element
    var story = document.createElement("div");
    story.classList.add("story");
    var id = `story_${auto_increment++}`;
    story.id = id
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
            var value = inputs[input_index] ?
                inputs[input_index] :
                template.substr(i + 1, stop - i - 1);

            // Prepare the input field
            input_field.setAttribute("story-id", id);
            input_field.setAttribute("value", value);
            input_field.setAttribute("input-index", input_index);
            input_field.setAttribute('onclick', "this.setSelectionRange(0, this.value.length);")
            input_field.setAttribute("oninput", "update_story(this, true)");
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
    var delete_button = new Image();
    delete_button.src = "design/delete_0.png";
    delete_button.setAttribute("story-id", id);
    delete_button.classList.add("delete-button");
    delete_button.id = 'delete_'+id;
    delete_button.title = "Delete this story (use CTRL+Z to undo!)"
    delete_button.setAttribute('onclick', "delete_story(this)")
    story.appendChild(delete_button);

    document.getElementById('stories').appendChild(story);
    animate_image("delete_" + id, "design/delete_x.png", 2, 300);
    return story;
}

function get_origin_url(){
    return location.origin + location.pathname
}
