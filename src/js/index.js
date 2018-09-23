import Common from "./utils/common";
import DayDate from "./utils/date";
import db from "./utils/init";
import "./table_dose";

/**
 * Diabet Table Creater
 *
 * @author Robert Aslanyan
 * @version 2.2
 *
 */
const printBtn = document.querySelector(".print"); // Button from printing

if (location.pathname === "/" || location.pathname.endsWith("index.html")) {
  const addBtn = document.querySelector(".add_row"); // Button from adding new row
  const setBtn = document.querySelector(".set_date"); // Button from set date
  const modal = document.querySelector(".modal"); // Modal
  const tableBody = document.querySelector("tbody"); // Table Body
  const saveBtn = document.querySelector(".save_btn"); // Button from save data
  const loadBtn = document.querySelector(".load_btn"); // Button from load data
  const MIN = { mg: 60, mmol: 3.3 }; // Min value of sugar in blood
  const MAX = { mg: 460, mmol: 25.5 }; // Max value of sugar in blodd
  const langs = document.querySelector(".langs");
  const bgTypes = document.querySelector("#sugar_convertor");

  let date = new DayDate();
  date.getNow();

  setBtn.addEventListener("click", setDate);
  addBtn.addEventListener("click", addRow);

  saveBtn.addEventListener("click", saveData);
  loadBtn.addEventListener("click", loadData);

  langs.addEventListener("change", langChange);
  bgTypes.addEventListener("change", bgTypeChange);

  (async function() {
    let defaultLang = langs.options[langs.selectedIndex].getAttribute(
        "data-lang"
      ),
      docTimes = await Common.getAllDocs(db, "Doses");
    let defaultType = bgTypes.options[bgTypes.selectedIndex].value;
    let fr = document.createDocumentFragment();

    docTimes.forEach((docTime, idx) => {
      let th = document.createElement("th");
      th.textContent = docTime;
      th.className = "inj_time";
      th.setAttribute("data-index", idx);
      th.setAttribute("data-time", docTime);
      th.title = "Double click for delete column";

      fr.appendChild(th);
    });

    document.querySelector(".table_head").appendChild(fr);

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

    /** Set Language Value  */
    Common.setCookie("_lang", defaultLang, 1);

    /** Set Type Value */
    Common.setCookie("_type", defaultType, 1);
  })();

  /**
   * Calculate Insulin Doses and
   * set the values in the table
   *
   * @param {Number} num
   * @param {Number} type
   */
  function calcDose(num, type) {
    let value = Number(this.firstChild.value) || Number(num),
      docRef = db.collection("Doses").doc(type),
      bgType = Common.getCookie("_type");

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
        value = bgType === "mg" ? Math.round(value) : value.toFixed(1);
        createSpan(this, result, value, bgType);
      }
    });
  }
  function createSpan(el, obj, value, type) {
    let keys = Object.keys(obj);
    el.innerHTML = `<span class="sugar_value">${value}</span> <br/>`;
    el.setAttribute("data-type", type);
    keys.forEach(key => {
      if (obj[key] !== 0) {
        return (el.innerHTML += ` <span class="dose_value" data-css="${key[0].toUpperCase()}">${
          obj[key]
        }</span>`);
      }
    });
  }

  function createDoseObj($data, value) {
    let from = $data.from,
      to = $data.to,
      dose = $data.dose,
      $value = null,
      types = Common.getCookie("_type");

    $value = types === "mg" ? value : mmolToMg(value);

    if ($value <= to && $value >= from) {
      return dose;
    }
  }

  function mgToMmol(value) {
    return (value / 18).toFixed(1);
  }

  function mmolToMg(value) {
    return Math.round(value * 18);
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

    tr.title = "Double click for delete row";

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
      if (tag) return e.target.parentNode.remove();
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
    let dose = e.target.className === "sugar_value";

    if (dose) {
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
        input.getAttribute("data-time"),
      bgType = Common.getCookie("_type");

    if (e.which === 13 && (value >= MIN[bgType] && value <= MAX[bgType])) {
      calcDose.call(this, value, index);
    } else if (e.which === 27) return (this.innerHTML = `<span></span>`);
  }

  /** Save and Load from localStorage */

  /**
   * Save Data to localStorage
   */
  function saveData(e) {
    let tr = document.querySelectorAll('tr[class="data"]'),
      result = [],
      type;
    document.querySelectorAll(".dose").forEach(dose => {
      if (dose.dataset.type !== undefined) type = dose.dataset.type;
      else type = Common.getCookie("_type");
    });

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
      localStorage.setItem("type", type);
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
    const type = localStorage.getItem("type");
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

    /** Select the option , which was in local storage  */
    Array.from(bgTypes.options).forEach(option => {
      if (option.value === type) {
        option.setAttribute("selected", "selected");
      }
    });
    /** Set cookie by this type */
    Common.setCookie("_type", type, 1);

    sugars.forEach((sugar, index) => {
      let time = doses[index].dataset.time;
      calcDose.call(doses[index], sugar, time, type);
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

  /** Blood Glucose Type Change*/
  function bgTypeChange() {
    let selectedType = this.options[this.selectedIndex].value,
      doses = document.querySelectorAll(".dose");

    if (Common.getCookie("_type")) {
      if (doses.length !== 0) {
        doses.forEach(dose => {
          let type = dose.dataset.type,
            value = Number(dose.firstChild.textContent);
          if (type !== undefined && type !== selectedType && value) {
            let $value = type === "mg" ? mgToMmol(value) : mmolToMg(value);
            dose.setAttribute("data-type", selectedType);
            dose.firstChild.textContent = $value;
          }
        });
      }
      Common.setCookie("_type", selectedType, 1);
    }
  }
}

/** Print  */
Common.print(printBtn);

/** Reset  */
Common.reset();
