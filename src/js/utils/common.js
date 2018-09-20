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

    console.log(this);
    if (content) {
      content.className = error ? "error" : "success";
      content.textContent = text;
      this.appendChild(content);

      setTimeout(() => content.remove(), durotation);
    }
  },
  async getAllDocs(db, coll) {
    let docs = [];
    let order =
      coll === "Doses"
        ? db.collection(coll).orderBy("index", "asc")
        : db.collection(coll);

    await order.get().then(el => el.docs.forEach(doc => docs.push(doc.id)));

    return docs;
  }
};

export default funcs;
