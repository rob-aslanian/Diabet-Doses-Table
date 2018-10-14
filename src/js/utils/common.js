import Langs from "./languages.json";

const funcs = {
  setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  },
  getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return null;
  },
  insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  },
  isArray(arr) {
    return Object.prototype.toString.call(arr) === "[object Array]";
  },
  insertInput(el, value) {
    el.innerHTML = `<input class="ins_field" maxlength="5" value=${
      value ? value : 0
    } "/>`;
  },
  insertInputWithSelect(elem, value, insulin) {
    let insulins = this.lsGet("insulins"),
      isValue = Number(value) || 0,
      el = null,
      canDelete =
        insulin !== undefined
          ? `<button class="delete_dose" data-type="${insulin}">Delete</button>`
          : "";

    insulins.forEach($insulin => {
      let isSelected = insulin === $insulin ? "selected" : "";

      return (el += `<option value=${$insulin} ${isSelected}>${this.capitalize(
        $insulin
      )}</option>`);
    });

    return (elem.innerHTML = `<div class="inp_group">
      <input type="text" class="ins_value_field" value="${isValue}">
        <select name="insulins_type" multiple size="2">
          <option value="insulins" disabled>Insulins</option>
          ${el}
        </select>
        ${canDelete}
    </div>`);
  },
  insertInputAndSelect(data) {
    let { childCount, doseField, doseValue, doseType, insulins } = data;
    let isValue = doseValue ? Number(doseValue) : 0;
    let showAll = childCount > 1 ? "" : ' <option value="*">All</option>';
    let canDelete =
      childCount > 1 ? '<button class="delete_dose">Delete</button>' : "";
    let el = "";

    insulins.forEach(insulin => {
      let sel = insulin == doseType ? "selected" : "";
      let disable =
        childCount === 0 ? "" : insulin == doseType ? "" : "disabled";
      el += `<option value="${insulin}" ${sel} ${disable} >${this.capitalize(
        insulin
      )}</option>`;
    });
    doseField.innerHTML = `<div class="inp_group">
      <input type="text" class="ins_field" value="${isValue}">
        <select name="insulins_type" >
          <option value="insulins" disabled>Insulins</option>
          ${showAll}
          ${el}
        </select>
        ${canDelete}
    </div>`;
  },
  print(el) {
    el.addEventListener("click", () => {
      document
        .querySelectorAll("button")
        .forEach(button => button.classList.add("hide"));
      document
        .querySelectorAll("select")
        .forEach(sel => sel.classList.add("hide"));
      window.print();
    });
  },
  reset() {
    window.onafterprint = () => {
      document
        .querySelectorAll("button")
        .forEach(button => button.classList.remove("hide"));
      document
        .querySelectorAll("select")
        .forEach(sel => sel.classList.remove("hide"));
    };
  },
  capitalize(str) {
    let firstLetter = str[0].toUpperCase(),
      $str = str.slice(1);
    return firstLetter + $str;
  },
  handler(text, error = true, durotation = 2500) {
    const hasMessage =
      document.querySelector(".error") || document.querySelector("success");
    let content = hasMessage ? null : document.createElement("div");

    if (content) {
      content.className = error ? "error" : "success";
      content.textContent = text;

      this.parentNode.insertBefore(content, this.nextSibling);

      setTimeout(() => content.remove(), durotation);
    }
  },
  createModal(type) {
    const el = `<div class="modal" style="display:flex">
        <div class="modal-content warning">
            <h1 class="${type}_head"></h1>
            <p class="${type}_text"></p>
            <a href="./doses.html" class="${type}_link"></a>
        </div >
    </div >`;
    document.body.innerHTML += el;
    return this.translate();
  },
  translate(selectedLang) {
    const selLang = Langs[selectedLang || this.getCookie("_lang") || "en"],
      objKeys = Object.keys(selLang);

    if (this.isArray(objKeys) && objKeys.length !== 0) {
      objKeys.forEach(key => {
        let buttons = key === "buttons";
        if (buttons) {
          let btns = selLang["buttons"],
            btnsClass = Object.keys(btns);
          btnsClass.forEach(btnClass => {
            let toTranslateBtn = document.querySelector(`button.${btnClass}`);
            if (toTranslateBtn) {
              toTranslateBtn.textContent = btns[btnClass];
            }
          });
        } else if (key !== "messages") {
          let toTranslate = document.querySelector(`.${key}`);
          if (toTranslate) {
            toTranslate.innerHTML = selLang[key];
          }
        }
      });
    }
    return (document.querySelector("html").lang =
      selectedLang || this.getCookie("_lang"));
  },
  async getAllDocs(db, coll) {
    let docs = [];
    let order =
      coll === "Doses"
        ? db.collection(coll).orderBy("index", "asc")
        : db.collection(coll);

    await order.get().then(el => el.docs.forEach(doc => docs.push(doc.id)));

    return docs;
  },
  lsGet(from) {
    return JSON.parse(localStorage.getItem(from));
  },
  lsSet(to, item) {
    return localStorage.setItem(to, JSON.stringify(item));
  },
  once(fn, context) {
    let result;

    return function(...args) {
      if (fn) {
        result = fn.apply(context || this, args);
        fn = null;
      }

      return result;
    };
  }
};

export default funcs;
