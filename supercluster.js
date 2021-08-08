// ==UserScript==
// @name         Post-ify!
// @namespace    http://isabroch.dk
// @version      0.1
// @description  Inject a button to wrap text into posts!
// @author       Izzy
// @match        https://supercluster.jcink.net/index.php?act=Post*
// @icon         https://www.google.com/s2/favicons?domain=jcink.net
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const container = $('#post-as .pformright');

  container.append(`<input type="button" class="forminput" name="iz-templateify" value="Template-ify!"> | <input type="button" class="forminput" name="iz-addpokemon" value="Add Pokemon!">`)

  function getCharacter() {
    return (
      $("#post_as_menu").attr("value") === "0"
      ? $("#logged-in-as").text().trim().split(" ")[0]
      : $("#post_as_menu option:selected").text().trim().split(" ")[1]
      ).toLowerCase();
  }

  function templateify() {
    const character = getCharacter();

      const tags = (()=> {
        const postedBy = $("#topic-summary tr:nth-child(2n-1) b");

        if (postedBy.length === 0 ) return "@[tag]"

        let tags = new Set();

        postedBy.each(function() {
          const text = $(this).text().toLowerCase();
          if (!text.match(new RegExp(`\\b${character}\\b`, "gi"))) {
            tags.add(`@[${text}]`);
          }
        })

        return [...tags].join(" & ") ;
      })();

      const textArea = document.querySelector(".textinput");
      textArea.value = ` [dohtml]<link href="https://solizzy.github.io/templates/supercluster/iz-container.css" rel="stylesheet"> <article class="iz-container ${character}"> <main class="main"> <div class="header" ></div>\n <div class="content">\n ${textArea.value
      .replace(/^|\n\n/gi, `\n\n<p>`) /* paragraphs */
      .replace(/\*\*\*(.*?)\*\*\*/gi, `[b][i]$1[/i][/b]`) /* bold italics */
      .replace(/\*\*(.*?)\*\*/gi, `[b]$1[/b]`) /* bold */
      .replace(/\*(.*?)\*/gi, `[i]$1[/i]`) /* italics */
      .trim()} \n\n <div class="ooc">\n <p>${tags}\n </div>\n\n </div> </main> </article>[/dohtml]`;
  }

  async function addPokemon(char = getCharacter()) {
    const apps = {
      orion: "https://supercluster.jcink.net/index.php?showtopic=396",
      veronica: "https://supercluster.jcink.net/index.php?showtopic=547"
    }

    const resp = await fetch(apps[char]);
    const text = await resp.text();
    const html = new DOMParser().parseFromString(text, "text/html");

    const style = `<style>
    .pdo-overlay {
      position: fixed;
      z-index: 1000;
      inset: 0;
      display: flex;
      place-items: center;
      place-content: center;
    }

    .pdo-content {
      position: relative;
      background: white;
      padding: 1em;
    }

    .pdo-content label {
      display: block;
      margin-block: 2px;
    }

    .showHP {
      margin-top: 10px !important;
    }

    .pdo-pkmn {
      text-align: left;
      max-height: 50vh;
      overflow-y: scroll;
      padding-right: 20px;
      margin-block: 10px;
    }

    .pdo-content button {
      width: 100%;
      line-height: 1.5;
    }

    .pdo-overlay::before {
      content: '';
      display: block;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
    }</style>`

    $("body").append(`<div class="pdo-overlay"><div class="pdo-content"><b>${char} pokemon</b>
    <div class="pdo-pkmn"></div>
    <label class="showHP"><input type="checkbox" name="pkmn-showHP"> Show HP</label> <button type="button" class="pdo-submit">Submit Pokemon!</button></div> ${style}</div> `);

    const pokemon = html.querySelectorAll(".scapp-pmbx pkmn");

    const pokedex = {};

    pokemon.forEach( (el) => {
      const isMain = el.parentElement.classList.contains("pmbx-main");
      const species = [...el.classList].join(" ");
      const title = el.title;
      const key = `${species} | ${title}`

      pokedex[key] = el;

      const pkmnEl = `<label><input type="checkbox" name="pkmn-${species.replace(" ", "-")}" value="${key}" ${isMain? "checked" : ""}> ${title} (${species})</label>`;

      $(".pdo-pkmn").append(pkmnEl);
    })

    function closeOverlay(e = {code: "Escape"}) {
      if (e.code === "Escape") {
        $(".pdo-overlay").remove()
        document.removeEventListener("keydown", closeOverlay)
      }
      return;
    }

    document.addEventListener("keydown", closeOverlay)


    let newHtml = "";

    function getPkmn() {
      document.querySelectorAll(".pdo-pkmn input").forEach(el => {
        if (el.checked) {
          const pkmnEl = pokedex[el.value];

          if (!(document.querySelector(`[name="pkmn-showHP"]`).checked)) { pkmnEl.dataset.hp = "" };

          newHtml += `${pkmnEl.outerHTML}\n`;
        }
      })

      const textArea = document.querySelector(".textinput");
        textArea.value = textArea.value.replace(`<div class="header" ></div>`, `<div class="header" ><div class="pkmn">\n${newHtml}</div></div>`)

      closeOverlay();
    }

    $(".pdo-submit").click(() => {
      getPkmn();
      closeOverlay();
    })


  }

  $("[name=iz-templateify]").click(() => templateify())

  $("[name=iz-addpokemon]").click(() => addPokemon())

})();
