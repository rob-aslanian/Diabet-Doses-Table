import Common from "./utils/common";
import DayDate from "./utils/date";
import { DOSE as Dose, INJECTION as Insulin } from "./utils/dose";
import db from "./utils/init";
import "./table_dose";
import { types } from "util";

/**
 * Diabet Table Creater
 *
 * @author Robert Asllanyan
 * @version 3.5
 *
 * Last Modify 06/6/2018
 */

if (location.pathname === "/") {
  const addBtn = document.querySelector(".add_row"); // Button from adding new row
  const setBtn = document.querySelector(".set_date"); // Button from set date
  const modal = document.querySelector(".modal"); // Modal
  const printBtn = document.querySelector(".print"); // Button from printing
  const tableBody = document.querySelector("tbody"); // Table Body
  const saveBtn = document.querySelector(".save_btn"); // Button from save data
  const loadBtn = document.querySelector(".load_btn"); // Button from load data
  const buttons = document.querySelectorAll("button"); // All button (for print)
  const min = 60; // Min value of sugar in blood
  const max = 460; // Max value of sugar in blodd
  const langs = document.querySelector(".langs");

  let date = new DayDate();
  date.getNow();

  setBtn.addEventListener("click", setDate);
  addBtn.addEventListener("click", addRow);

  saveBtn.addEventListener("click", saveData);
  loadBtn.addEventListener("click", loadData);

  langs.addEventListener("change", langChange);

  (async function() {
    let defaultLang = langs.options[langs.selectedIndex].getAttribute(
        "data-lang"
      ),
      docTimes = await Common.getAllDocs(db, "Doses");
    let fr = document.createDocumentFragment();

    docTimes.forEach((docTime, idx) => {
      let th = document.createElement("th");
      th.textContent = docTime;
      th.className = "inj_time";
      th.setAttribute("data-index", idx);
      th.setAttribute("data-time", docTime);

      fr.appendChild(th);
    });

    document.querySelector(".table_head").appendChild(fr);
    /** Set Language Value  */
    Common.setCookie("_lang", defaultLang, 1);

    document.querySelectorAll(".inj_time").forEach(el => {
      el.addEventListener("dblclick", removeColumn);
    });

    function removeColumn(e) {
      let time = e.target.dataset.time,
        idx = docTimes.indexOf(time),
        trCount = document.querySelectorAll(".data").length;

      if (trCount === 0) {
        docTimes.splice(idx, 1);
        e.target.remove();
      }
    }
  })();

  /**
   * Calculate Insulin Doses and
   * set the values in the table
   *
   * @param {Number} num
   * @param {Number} type
   */
  function calcDose(num, type) {
    let value = this.firstChild.value || num,
      docRef = db.collection("Doses").doc(type);

    docRef.get().then(el => {
      if (el && el.exists) {
        let data = el.data(),
          type = data["type"],
          result = {};

        if (data[type] !== undefined) {
          data[type].forEach($data => {
            if (createDoseObj($data, value) !== undefined) {
              result[type] = createDoseObj($data, value);
            }
          });
        } else {
          if (Common.isArray(type)) {
            type.forEach(tp => {
              data[tp].forEach($data => {
                if (createDoseObj($data, value) !== undefined) {
                  result[tp] = createDoseObj($data, value);
                }
              });
            });
          }
        }
        createSpan(this, result, value);
      }
    });

    function createDoseObj($data, value) {
      let from = $data.from,
        to = $data.to,
        dose = $data.dose;

      if (value <= to && value >= from) {
        return dose;
      }
    }
  }
  function createSpan(el, obj, value) {
    let keys = Object.keys(obj);
    el.innerHTML = `<span>${value}</span> <br/>`;
    keys.forEach(key => {
      if (obj[key] !== 0) {
        return (el.innerHTML += ` <span class="${key}">${obj[key]}</span>`);
      }
    });
  }

  /**
   * Add new row to the table
   *
   * @param {Event|String} pointDates
   *
   */
  function addRow(pointDates, times = null) {
    let tr = document.createElement("tr"),
      injTime = Array.prototype.slice.call(
        document.querySelectorAll(".inj_time")
      ),
      fragment = document.createDocumentFragment(),
      idx = 0,
      len = times ? times.length : injTime.length;

    for (let i = 0; i <= len; i++) {
      let td = document.createElement("td");
      if (i === 0) {
        td.setAttribute("data-lang", Common.getCookie("_lang"));
        td.className = "date_time";
        td.textContent =
          typeof pointDates === "string" ? pointDates : date.getPrevDay();
      } else {
        if (!times) {
          injTime.forEach((el, indx) => {
            if (indx === idx) {
              let time = el.getAttribute("data-time");
              td.setAttribute("data-time", time);
            }
          });
        } else {
          td.setAttribute("data-time", times[idx]);
        }
        td.className = "dose";
        td.setAttribute("data-index", idx++);
        td.innerHTML = `<input type="text">`;
      }

      tr.className = "data";
      fragment.appendChild(td);
    }

    tr.appendChild(fragment);
    /**
     * Delete Row
     */
    tr.addEventListener("dblclick", e => {
      let tag = e.target.localName == "td";
      let hasClass = e.target.className == "";

      if (tag && hasClass) return e.target.parentNode.remove();
    });

    tableBody.appendChild(tr);

    let inputsField = document.querySelectorAll(".dose");

    inputsField.forEach(input => {
      input.addEventListener("keyup", addSugar); // Event from calculated doses
      input.addEventListener("dblclick", changeValue); // Event from edit value
    });
  }

  /**
   * Change value in the table , also
   * calculate new doses for new sugar value
   * @param {Event} e
   */
  function changeValue(e) {
    let dose =
      e.target.className == "dose" ? e.target : e.target.className !== "apidra";

    if (dose.children !== undefined) {
      return updateDoseValue(dose);
    } else if (dose) {
      return updateDoseValue(e.target);
    }
  }

  function updateDoseValue(el) {
    let value = Number(el.textContent || el.children[0].textContent),
      index =
        el.getAttribute("data-index") ||
        el.parentNode.getAttribute("data-index"),
      time =
        el.getAttribute("data-time") || el.parentNode.getAttribute("data-time");

    return (el.innerHTML = `<input type="text" data-time="${time}" value=${value} data-index="${index}">`);
  }
  /**
   * Set Date
   * @param {Event} e
   */
  function setDate(e) {
    e.preventDefault();

    const dates = document.querySelector("#date").value;
    const dur = Number(document.querySelector("#durotation").value);

    if (dur && dates && dur > 0) {
      let fullDate = dates.split("-");
      let start = `${fullDate[1]} ${fullDate[2]}, ${fullDate[0]}`;

      let setDates = date.setFromTo(start, dur);

      setDates.forEach(dates => {
        let template = `${dates.day} ${dates.month}`;
        addRow(template);
      });
      modal.style.display = "none";
    }
  }
  /**
   * Add  value for the sugar value
   * @param {Event} e
   */
  function addSugar(e) {
    let input = e.target,
      value = Number(input.value),
      index =
        e.target.parentNode.getAttribute("data-time") || // Index of column
        input.getAttribute("data-time");

    if (e.which === 13 && (value >= min && value <= max))
      calcDose.call(this, value, index);
    else if (e.which === 27) return (this.innerHTML = `<span></span>`);
  }

  /** Save and Load from localStorage */

  /**
   * Save Data to localStorage
   */
  function saveData(e) {
    let tr = document.querySelectorAll('tr[class="data"]');
    let result = [];

    tr.forEach(el => {
      let childs = Array.prototype.slice.call(el.children);
      let day = childs[0].textContent;
      let sugars = [];
      let docTimes = [];
      document.querySelectorAll(".inj_time").forEach(el => {
        docTimes.push(el.dataset.time);
      });

      childs.map((elem, index) => {
        if (index !== 0) {
          let sugarResult = elem.firstChild.nextSibling || elem.firstChild;

          if (sugarResult && sugarResult.previousElementSibling)
            sugars.push(sugarResult.previousElementSibling.textContent);
          else if (sugarResult && sugarResult.textContent)
            sugars.push(sugarResult.textContent);
          else sugars.push("");
        }
      });

      result.push({
        day,
        sugars
      });

      localStorage.setItem("sugar", JSON.stringify(result));
      localStorage.setItem("times", JSON.stringify(docTimes));
    });
  }

  /**
   * Load Date from localStorage
   */
  function loadData() {
    const data = JSON.parse(localStorage.getItem("sugar"));

    let sugars = [];

    if (data) {
      data.map(el => {
        sugars.push(...el.sugars);
        loadSuagrs(el.day, sugars);
      });
    }

    this.setAttribute("disabled", "disabled");
  }

  function loadSuagrs(day, sugars) {
    const times = JSON.parse(localStorage.getItem("times"));
    addRow(day, times);

    let doses = document.querySelectorAll(".dose");

    /** Remove times from column , which did`t icnlude times from local storage*/
    document.querySelectorAll(".inj_time").forEach(el => {
      let time = el.dataset.time;
      if (!times.includes(time)) {
        el.remove();
      }
    });
    addBtn.setAttribute("disabled", "disabled");
    document.querySelector("#start_modal").setAttribute("disabled", "disabled");

    sugars.forEach((sugar, index) => {
      let time = doses[index].dataset.time;
      calcDose.call(doses[index], sugar, time);
    });
  }

  /** Language Change  */
  function langChange() {
    let selectedLang = this.options[this.selectedIndex].getAttribute(
        "data-lang"
      ),
      langs = {
        ge: { time: "დრო", day: "დღე" },
        ru: { time: "Время", day: "День" },
        en: { time: "Time", day: "Day" }
      },
      time = document.querySelector(".time"),
      day = document.querySelector(".day");

    if (Common.getCookie("_lang")) {
      let lan = langs[selectedLang];
      time.textContent = lan.time;
      day.textContent = lan.day;

      Common.setCookie("_lang", selectedLang, 1);

      return date.changeLang();
    }
  }

  /** Print  */
  printBtn.addEventListener("click", e => {
    buttons.forEach(button => button.classList.add("hide"));
    langs.classList.add("hide");
    window.print();
  });

  /** Reset  */
  window.onafterprint = () => {
    buttons.forEach(button => button.classList.remove("hide"));
    langs.classList.remove("hide");
  };
}
