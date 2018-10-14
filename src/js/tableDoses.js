import Common from "./utils/common";
import Langs from "./utils/languages.json";

if (location.pathname.endsWith("doses.html")) {
  (function() {
    if (!Common.lsGet("doses")) {
      Common.lsSet("doses", {});
    }

    if (!Common.lsGet("insulins")) {
      Common.lsSet("insulins", []);
    }

    const times = Object.keys(Common.lsGet("doses")),
      insulins = Common.lsGet("insulins");

    // Insert all times in html after load
    times.forEach(time => {
      insertDoseTime(time);
      return createColumn(time);
    });
    insulins.forEach(insulin => insertInsulin(insulin)); // Insert all insulins in html after laod

    Common.translate();
  })();

  /** Vars  */
  const addBtn = document.querySelector("#new_column"),
    addInsulinForm = document.querySelector("#insulin_add_form"),
    table = document.querySelector("table"),
    setLang = Common.getCookie("_lang") || "en",
    messages = Langs[setLang]["messages"],
    fm = [60, 100, 130, 160, 190, 220, 250, 280, 310, 340, 370, 400, 430],
    to = [99, 129, 159, 189, 219, 249, 279, 309, 339, 369, 399, 429, 460];

  /** Events */
  addBtn.addEventListener("click", createColumn);
  addInsulinForm.addEventListener("submit", addInsulin);
  table.addEventListener("mouseover", eventsHandler);

  function eventsHandler(e) {
    let currElem = e.target,
      currClass = currElem.className,
      currNode = currElem.nodeName;

    if (currClass === "inj_time" && currNode === "TH") {
      /** Delete column */
      //currElem.addEventListener("dblclick", deleteDosesColumn);
    } else if (currClass === "delete_dose" && currNode === "BUTTON") {
      /** Delete insulin from column */
      currElem.addEventListener("click", deleteInsulin, true);
    } else if (currClass === "ins_type" && currNode === "SPAN") {
      /** Update insulin value **/
      currElem.addEventListener("click", updateDoseValue);
    }
  }

  /** Insert dose time from sorting them */
  function insertDoseTime(time) {
    const row = document.querySelector(".row"),
      elem = `<div class="empty">
          <div class="fill" draggable="true">${time}</div>
        </div>`;
    row.innerHTML += elem;
  }

  /** Add insulin */
  function addInsulin(e) {
    e.preventDefault();
    let inputTarget = e.target.firstChild.nextElementSibling,
      regExp = /^\w{3,}$/,
      inputValue = inputTarget.value.toLowerCase(),
      insulins = Common.lsGet("insulins");

    if (
      inputValue &&
      regExp.test(inputValue) &&
      !insulins.includes(inputValue)
    ) {
      let ins = insulins || [];
      ins.push(inputValue);
      inputTarget.value = "";

      Common.lsSet("insulins", ins);

      return insertInsulin(inputValue);
    } else {
      let text =
        inputValue && regExp.test(inputValue)
          ? messages["exist"].replace("%_%", inputValue)
          : messages["invalidValue"];

      return Common.handler.call(
        document.querySelector("#insulin_add_form"),
        text
      );
    }
  }
  /** Insert insulin to html */
  function insertInsulin(insulin) {
    let li = document.createElement("li");
    li.className = "insulins_list_item";
    li.dataset.type = insulin;
    li.textContent = Common.capitalize(insulin);

    li.addEventListener("click", removeInsulin);

    return document.querySelector("#insulins_list").appendChild(li);
  }

  /** Remove insulin */
  function removeInsulin(e) {
    let insulin = e.target.dataset.type,
      insulins = Common.lsGet("insulins"),
      times = Common.lsGet("times"),
      doses = Common.lsGet("doses"),
      wMessage = messages["deleteInsulin"].replace("%_%", insulin),
      sMessage = messages["deleted"].replace("%_%", insulin);

    if (insulins.includes(insulin) && confirm(wMessage)) {
      times.forEach((time, idx) => {
        let deletedItem = doses[time][insulin];
        if (deletedItem !== undefined) {
          /** Delete current insulin type from local storage */
          delete doses[time][insulin];

          if (Object.keys(doses[time]).length === 0) {
            /** Delete from doses time object , if it empty */
            delete doses[time];
            times.splice(idx, 1);

            removeColumn(time, idx);
            /** Set times */
            Common.lsSet("times", times);
          }

          /** Remove items from html , which types equal to insulin */
          document
            .querySelectorAll(`.ins_type[data-type="${insulin}"]`)
            .forEach(elems => elems.remove());

          /** Set doses */
          Common.lsSet("doses", doses);
        } else return;
      });

      let index = insulins.indexOf(insulin);
      insulins.splice(index, 1);

      Common.lsSet("insulins", insulins);
      e.target.remove();

      return Common.handler.call(
        document.querySelector("#insulin_add_form"),
        sMessage,
        false
      );
    } else return;
  }

  /** Crate new column and insert it in html */
  function createColumn(e) {
    const fields = document.querySelectorAll(".sugars_res"),
      th = document.createElement("th");

    th.addEventListener("click", doseTimeUpdate);
    dosesTimeInsert(th, typeof e === "string" ? e : null);

    fields.forEach((field, idx) => {
      let td = document.createElement("td"),
        doses = Common.lsGet("doses");
      td.dataset.index = document.querySelectorAll(".inj_time").length - 1;
      td.className = "doses";
      /** Load and insert  */
      if (typeof e === "string") {
        let types = Object.keys(doses[e]);

        /** If object is empty */
        if (Object.keys(doses[e]).length === 0) {
          Common.insertInputWithSelect(td);
          addDoseValue(td);
        }

        types.forEach(type => {
          let el = insertDosesValue(doses[e][type][idx].dose, type, e);
          td.innerHTML += el;
        });
        /** Set new values */
      } else {
        Common.insertInputWithSelect(td);
        addDoseValue(td);
      }

      return field.appendChild(td);
    });
  }

  /** Add dose value */
  function addDoseValue(elem) {
    let inputEl = elem.firstChild.childNodes[1] || elem.childNodes[1];
    inputEl.addEventListener("keyup", dosesValueValidate);
  }

  /** Validate doses value */
  function dosesValueValidate(e) {
    let currTarget = e.target || e,
      parentEl = currTarget.parentNode.parentNode,
      currIndex = parentEl.parentNode.dataset.index,
      value = currTarget.value,
      index = parentEl.dataset.index,
      thEl = document.querySelectorAll(".inj_time")[index],
      selectEl = currTarget.nextElementSibling,
      insOption = Array.from(selectEl.selectedOptions),
      insType = insOption.map(item => item.value),
      regExp = /^\d{1,2}$/,
      insulins = Common.lsGet("insulins"),
      rgStr = insulins.reduce($str => ($str += "\\d{1,2}(\\s+)"), ""),
      injTime = thEl.dataset.time,
      regExpFull = new RegExp(`^${rgStr}?$`),
      enterBtn = e.which === 13,
      escBtn = e.which === 27,
      result = "";

    if (injTime === undefined) return alert(messages["setTheTime"]);

    if (
      (regExp.test(value) && enterBtn) ||
      (regExpFull.test(value) && enterBtn)
    ) {
      if (insType.length === 0) return alert(messages["selectInsType"]);

      insType.forEach((type, idx) => {
        let $value = value.split(" ");
        $value[idx] = $value[idx] === undefined ? $value[0] : $value[idx];

        if (insType.length > 1) {
          result += insertDosesValue(Number($value[idx]), type, injTime);
        } else {
          result = insertDosesValue(Number($value[idx]), type, injTime);
        }
        setDosesValue($value[idx], type, currIndex, injTime);
      });

      /** Insert result to html */
      currTarget.parentNode.className = "hide";
      this.parentNode.parentNode.innerHTML += result;
    } else if (escBtn) {
      let type =
        currTarget.nextElementSibling.options[
          currTarget.nextElementSibling.selectedIndex
        ].value;
      result = insertDosesValue(value, type, injTime);
      currTarget.parentNode.parentNode.replaceChild(
        createElementFromHTML(result),
        currTarget.parentNode
      );
    }
  }

  /** Make html elem from string */
  function createElementFromHTML(htmlString) {
    var div = document.createElement("div");
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild;
  }

  /** Set dose value to local storage */
  function setDosesValue(value, type, index, injTime) {
    let doses = Common.lsGet("doses"),
      obj = doses[injTime] || {},
      hasDoseArr = obj[type] || [];

    if (hasDoseArr.length !== 0) {
      hasDoseArr.forEach(elem => {
        if (elem.to == index) {
          elem.dose = Number(value);
        }
      });
    } else {
      fm.forEach((from, idx) => {
        hasDoseArr.push({
          dose: to[idx] == index ? Number(value) : 0,
          from,
          to: to[idx]
        });
      });
    }

    if (doses[injTime] !== undefined) {
      obj[type] = hasDoseArr;
      doses[injTime] = obj;

      Common.lsSet("doses", doses);
    }
  }

  function insertDosesValue(value, type, time) {
    let hasValue = value === 0,
      cssType = hasValue || !type ? "" : `data-css="${type[0].toUpperCase()}"`,
      showValue = hasValue ? "" : value,
      hasType = !type ? "" : `data-type=${type}`,
      el = `<span class="ins_type"
                    ${cssType}
                    ${hasType}
                    data-time=${time}>${showValue}</span>`;

    return el;
  }

  /** Update dose value */
  function updateDoseValue() {
    let currEl = this.nodeName !== "TD" ? this : this.firstChild,
      parent = currEl.parentNode,
      value = Number(currEl.textContent),
      insType = currEl.dataset.type;

    Common.insertInputWithSelect(currEl, value, insType);

    let el = currEl.firstChild;
    parent.replaceChild(el, currEl);

    return addDoseValue(el);
  }

  /** Delete doses value and time from local storage */
  function deleteDosesColumn(e) {
    let time = e.target.textContent,
      times = Common.lsGet("times"),
      index = times.indexOf(time),
      doses = Common.lsGet("doses");

    if (confirm(messages["deleteColumn"])) {
      delete doses[time];
      times.splice(index, 1);
      e.target.parentNode.remove();

      Common.lsSet("doses", doses);
      Common.lsSet("times", times);

      return removeColumn(time, index);
    } else return;
  }

  /** Delete insulin type from clolumn */
  function deleteInsulin(e) {
    let currElem = e.target,
      insType = currElem.dataset.type,
      currIndex = currElem.parentNode.parentNode.dataset.index,
      times = Common.lsGet("times"),
      time = times[currIndex],
      doses = Common.lsGet("doses"),
      wMessage = messages["deleteFromColumn"].replace("%_%", insType),
      sMessage = messages["deleted"].replace("%_%", insType);

    if (confirm(wMessage)) {
      // Remove type
      delete doses[time][insType];

      /** If only one type exist in column */
      if (Object.keys(doses[time]).length === 0) {
        delete doses[time];
        times.splice(currIndex, 1);
        removeColumn(time, currIndex);

        Common.lsSet("times", times);
      }

      /** Remove items for html */
      currElem.parentNode.remove();
      document
        .querySelectorAll(
          `.ins_type[data-time="${time}"][data-type="${insType}"]`
        )
        .forEach(el => el.remove());

      /** Message */
      Common.handler.call(document.querySelector(".print"), sMessage, false);

      /** Set do local storage */
      Common.lsSet("doses", doses);
    } else {
      let value = currElem.parentNode.childNodes[1].value,
        result = insertDosesValue(value, insType, time);

      currElem.parentNode.parentNode.innerHTML = result;
      currElem.parentNode.remove();
    }
  }

  /** Remove column from html */
  function removeColumn(time, index) {
    document.querySelector(`.inj_time[data-time="${time}"]`).remove();
    document
      .querySelectorAll(`.doses[data-index="${index}"]`)
      .forEach(dose => dose.remove());
  }

  /** Insert dose time  */
  function dosesTimeInsert(elem, hasValues) {
    elem.className = "inj_time";
    hasValues ? (elem.dataset.time = hasValues) : null;

    document.querySelector(".doses_row").appendChild(elem);

    if (hasValues) {
      return (elem.textContent = hasValues);
    }

    Common.insertInput(elem, "0:00");

    return dosesTimeValidate(elem.firstChild);
  }

  /** Update dose time */
  function doseTimeUpdate(e) {
    let target = e.target,
      currTime = target.dataset.time;

    Common.insertInput(target, currTime);

    return dosesTimeValidate(target.firstChild, currTime);
  }

  /** Validate dose time */
  function dosesTimeValidate(input, hasTime) {
    input.addEventListener("keyup", e => {
      let time,
        hasError = false,
        elemToInsert = input.parentNode,
        value = e.target.value,
        regExpFull = /^\d{1,2}:[0-5]\d$/,
        regExpNum = /^\d{1,2}$/,
        enterBtn = e.which === 13,
        escBtn = e.which === 27;

      if (enterBtn) {
        if (regExpFull.test(value)) {
          let hours = value.split(":")[0];
          hours <= 23 ? (time = value) : (hasError = true);
        } else if (regExpNum.test(value)) {
          value <= 23 ? (time = `${value}:00`) : (hasError = true);
        } else hasError = true;
      } else if (escBtn) {
        elemToInsert.innerHTML = hasTime;
      }

      if (hasError) {
        Common.handler.call(
          document.querySelector(".print"),
          messages["invalidValue"]
        );
      } else if (time !== undefined && !hasError) {
        let doses = Common.lsGet("doses");
        if (doses[time] !== undefined) {
          return Common.handler.call(
            document.querySelector(".print"),
            messages["exist"].replace("%_%", time)
          );
        }
        elemToInsert.dataset.time = time;
        elemToInsert.innerHTML = time;

        return setDoseTimeToLS(time, hasTime);
      }
    });
  }

  /** Add dose time to localStorage */
  function setDoseTimeToLS(time, hasTime) {
    let doses = Common.lsGet("doses") || {};

    /** Upate dose time  */
    if (hasTime !== undefined) {
      let result = doses[hasTime];

      doses[time] = result;
      delete doses[hasTime];
    } else {
      doses[time] = Common.lsGet("doses")[time] || {};
    }

    Common.lsSet("times", Object.keys(doses));
    Common.lsSet("doses", doses);

    return insertDoseTime(time);
  }

  /** Drag and drop , from sorting time and deleting doses */
  const empties = document.querySelectorAll(".empty");
  const fills = document.querySelectorAll(".fill");

  empties.forEach(empty => {
    empty.addEventListener("dragover", dragOver);
    empty.addEventListener("drop", drop);
  });

  fills.forEach((fill, idx) => {
    fill.id = `index_${idx}`;
    fill.addEventListener("dragstart", dragStart);
    fill.addEventListener("dragend", e => (e.target.className = "fill"));
    fill.addEventListener("click", deleteDosesColumn);
  });

  // Functions
  function dragStart(e) {
    e.dataTransfer.setData("text", e.target.id);
    this.classList.add("hold");
    setTimeout(() => this.classList.add("hide"));
  }

  function dragOver(e) {
    e.preventDefault();
  }
  function drop(e) {
    e.preventDefault();
    const data = document.getElementById(e.dataTransfer.getData("text")),
      srcParent = data.parentNode,
      tgt = e.currentTarget.firstElementChild,
      doses = Common.lsGet("doses"),
      newDose = {};

    e.currentTarget.replaceChild(data, tgt);
    srcParent.appendChild(tgt);

    empties.forEach(empty => {
      let value = empty.firstElementChild.textContent;
      newDose[value] = doses[value];
    });

    Common.lsSet("doses", newDose);
  }
}
