import Common from "./utils/common";
import DayDate from "./utils/date";
import "./tableDoses";

/**
 * Diabet Doses Table
 *
 * @author Robert Aslanyan
 * @version 3.0
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
  const langs = document.querySelector(".langs"); // Languages (select)
  const bgTypes = document.querySelector("#sugar_convertor"); // Sugar converter (select)
  const autoSave = document.querySelector("#auto_save"); // Auto save (checkbox)
  const settings = Common.lsGet("settings");

  let date = new DayDate();
  date.getNow();

  //****** Events ******//
  setBtn.addEventListener("click", setDate); // Set date
  addBtn.addEventListener("click", addRow); // Add new row

  saveBtn.addEventListener("click", saveData); // Save data to local storage
  loadBtn.addEventListener("click", loadData); // Load data from local storage

  langs.addEventListener("change", langChange); // Change languages
  bgTypes.addEventListener("change", bgTypeChange); // Bloog glucose convertor

  /** Set Cookie by auto save checkbox value */
  autoSave.addEventListener("click", e => {
    if (e.target.checked) {
      return Common.setCookie("_autoSave", true, 1);
    }
    return Common.setCookie("_autoSave", false, 1);
  });

  /** Do this after load  */
  (function() {
    if (
      !Common.lsGet("doses") ||
      Object.keys(Common.lsGet("doses")).length === 0
    ) {
      return Common.createModal("warning");
    }

    let defaultLang = langs.options[langs.selectedIndex].getAttribute(
        "data-lang"
      ),
      docTimes = Common.lsGet("times"),
      defaultType = bgTypes.options[bgTypes.selectedIndex].value,
      cookieLang = Common.getCookie("_lang"),
      cookieAutoSave = Common.getCookie("_autoSave"),
      fr = document.createDocumentFragment();

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

    if (!Common.lsGet("settings")) {
      let _settings = {
        lang: defaultLang,
        autoSave: false,
        insulinType: defaultType
      };
      Common.lsSet("settings", _settings);
    } else {
      let { lang, insulinType, autoSave } = Common.lsGet("settings");
    }

    /** Set Language Value  */
    if (!cookieLang) {
      Common.setCookie("_lang", defaultLang, 1);
    } else {
      Array.from(langs.options).forEach(option => {
        option.dataset.lang === cookieLang
          ? option.setAttribute("selected", "selected")
          : option.removeAttribute("selected");
      });

      langChange.call(langs);
    }

    document.querySelector("html").lang = cookieLang || defaultLang;

    /** Set Type Value */
    Common.setCookie("_type", defaultType, 1);

    /** Set Auto Save Value  */
    if (!cookieAutoSave) {
      Common.setCookie("_autoSave", autoSave.checked, 1);
    } else {
      cookieAutoSave == "true"
        ? autoSave.setAttribute("checked", "checked")
        : autoSave.removeAttribute("checked");
    }
  })();

  //****** Functions ****** //

  /**
   * Calculate Insulin Doses and
   * set the values in the table
   *
   * @param {Number} num
   * @param {String} type
   */
  function calcDose(num, time) {
    let value = Number(this.firstChild.value) || Number(num),
      bgType = Common.getCookie("_type"),
      doses = Common.lsGet("doses")[time],
      result = {};

    Object.keys(doses).forEach(type => {
      if (doses[type] !== undefined) {
        doses[type].forEach(dose => {
          if (createDoseObj(dose, value) !== undefined) {
            result[type] = createDoseObj(dose, value);
          }
        });
      }
      value = bgType === "mg" ? Math.round(value) : Number(value).toFixed(1);
      createSpan(this, result, value, bgType);

      if (Common.getCookie("_autoSave") == "true") {
        return saveData();
      }
    });

    // docRef.get().then(el => {
    //   if (el && el.exists) {
    //     let data = el.data(),
    //       type = data["type"],
    //       result = {};

    //     if (data[type] !== undefined) {
    //       data[type].forEach($data => {
    //         if (createDoseObj($data, value) !== undefined) {
    //           result[type] = createDoseObj($data, value);
    //         }
    //       });
    //     } else {
    //       if (Common.isArray(type)) {
    //         type.forEach(tp => {
    //           data[tp].forEach($data => {
    //             if (createDoseObj($data, value) !== undefined) {
    //               result[tp] = createDoseObj($data, value);
    //             }
    //           });
    //         });
    //       }
    //     }
    //     value = bgType === "mg" ? Math.round(value) : value.toFixed(1);
    //     createSpan(this, result, value, bgType);
    //   }

    // });
  }
  /**
   *  Create new span or spans ,
   *  and insert it to the html
   *
   * @param {HTMLElement} el
   * @param {Object} obj
   * @param {Number|String} value
   * @param {String} type
   */
  function createSpan(el, obj, value, type) {
    //  if(!value || value === 0){
    //    el.innerHTML
    //  }
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

  /**
   * Calculate value and return dose
   *
   * @param {Object} $data
   * @param {String} value
   * @return {Number}
   */
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

  /**
   * Convert mg to mmol (blood glucose types)
   * @param {Number} value
   */
  function mgToMmol(value) {
    return (value / 18).toFixed(1);
  }

  /**
   * Convert mmol to mg  (blood glucose types)
   * @param {Number} value
   */
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

    // Delete row
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

  /**
   * Update dose and return input tag
   * with new value
   *
   * @param {HTMLElement} el
   */
  function updateDoseValue(el) {
    let value = Number(el.textContent || el.children[0].textContent),
      index =
        el.getAttribute("data-index") ||
        el.parentNode.getAttribute("data-index"),
      time =
        el.getAttribute("data-time") || el.parentNode.getAttribute("data-time");

    console.log(el);

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
        e.target.parentNode.getAttribute("data-time") ||
        input.getAttribute("data-time"), // Index of column
      bgType = Common.getCookie("_type");

    if (e.which === 13 && (value >= MIN[bgType] && value <= MAX[bgType])) {
      calcDose.call(this, value, index);
    } else if (e.which === 27) return (this.innerHTML = `<span></span>`);
  }

  /** Save and Load from localStorage */

  /**
   * Save Data to localStorage
   */
  function saveData() {
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

  /**
   * Load sugars for local storage
   *
   * @param {String} day
   * @param {Array} sugars
   */
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
    document.querySelector(".set_date").setAttribute("disabled", "disabled");

    /** Select the option , which was in local storage  */
    Array.from(bgTypes.options).forEach(option => {
      if (option.value === type) {
        option.setAttribute("selected", "selected");
      }
    });

    /** Set cookie by this type */
    Common.setCookie("_type", type, 1);

    /** Calc dose by this sugars value */
    sugars.forEach((sugar, index) => {
      let time = doses[index].dataset.time;
      calcDose.call(doses[index], sugar, time, type);
    });
  }

  /** Language Change  */
  function langChange() {
    let selectedLang = this.options[this.selectedIndex].dataset.lang;

    Common.translate(selectedLang);
    Common.setCookie("_lang", selectedLang, 1);

    return date.changeLang();
  }

  /** Blood Glucose Type Change*/
  function bgTypeChange() {
    let selectedType = this.options[this.selectedIndex].value,
      doses = document.querySelectorAll(".dose"),
      type = settings["insulinType"];

    if (type) {
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
      settings["insulinType"] = selectedType;
      Common.lsSet("settings", settings);
      Common.setCookie("_type", selectedType, 1);
    }
  }
}

/** Print  */
Common.print(printBtn);

/** Reset  */
Common.reset();
