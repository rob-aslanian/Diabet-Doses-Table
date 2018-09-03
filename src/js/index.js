import DayDate from "./date";
import { DOSE as Dose, INJECTION as Insulin } from "./dose";

/**
 * Diabet Table Creater
 *
 * @author Robert Asllanyan
 * @version 2.7
 *
 * Last Modify 06/6/2018
 */

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

let date = new DayDate();
date.getNow();

setBtn.addEventListener("click", setDate);
addBtn.addEventListener("click", addRow);

saveBtn.addEventListener("click", saveData);
loadBtn.addEventListener("click", loadData);

/**
 * Calculate Insulin Doses and
 * set the values in the table
 *
 * @param {Number} num
 * @param {Number} type
 */
function calcDose(num, type) {
  let length = Dose.from.length;
  let value = this.firstChild.value || num;
  let result = null;

  for (let i = 0; i < length; i++) {
    if (num <= Dose.to[i] && num >= Dose.from[i]) {
      if (Insulin[type].lantus !== undefined) {
        result = {
          apidra: Insulin[type].apidra[i],
          lantus: Insulin[type].lantus[i]
        };
      } else result = Insulin[type].apidra[i];
    }
  }

  if (!value) this.innerHTML += ``;

  if (typeof result === "object" && result) {
    return (this.innerHTML = `
                   <span>${value}</span>
                   <span class="apidra">${result.apidra}</span>
                   <span class="lantus">${result.lantus}</span>
                   
        `);
  }
  if (result !== undefined && result) {
    return (this.innerHTML = `
                   <span>${value}</span>
                   <span class="apidra">${result}</span>
                   `);
  } else return (this.innerHTML = `<span>${value}</span>`);
}

/**
 * Add new row to the table
 *
 * @param {Event|String} pointDates
 *
 */
function addRow(pointDates) {
  let tr = document.createElement("tr"),
    idx = 0;

  for (let i = 0; i < 6; i++) {
    let th = document.createElement("th");

    if (i === 0)
      th.textContent =
        typeof pointDates === "string" ? pointDates : date.getPrevDay();
    else {
      th.className = "dose";
      th.setAttribute("data-index", idx++);
      th.innerHTML = `<input type="text">`;
    }

    tr.className = "data";
    tr.appendChild(th);
  }

  /**
   * Delete Row
   */
  tr.addEventListener("dblclick", e => {
    let tag = e.target.localName == "th";
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
  let value = null;
  let index = null;

  if (dose.children !== undefined) {
    value = Number(dose.children[0].textContent);
    index = dose.getAttribute("data-index");

    dose.children[0].innerHTML = `<input type="text" value=${value} data-index=${index}>`;
  } else if (dose) {
    value = e.target.textContent;
    index = e.target.parentNode.getAttribute("data-index");

    e.target.innerHTML = `<input type="text" value=${value} data-index="${index}">`;
  }
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
      e.target.parentNode.getAttribute("data-index") || // Index of column
      input.getAttribute("data-index");

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
  let data = JSON.parse(localStorage.getItem("sugar"));
  let result = [];

  tr.forEach((el, idx) => {
    let childs = Array.prototype.slice.call(el.children);
    let day = childs[0].textContent;
    let sugars = [];

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
  addRow(day);
  let doses = document.querySelectorAll(".dose");

  sugars.forEach((sugar, index) => {
    let idx = doses[index].dataset.index;
    calcDose.call(doses[index], sugar, idx);
  });
}

/** Print  */
printBtn.addEventListener("click", e => {
  buttons.forEach(button => button.classList.add("hide"));

  window.print();
});

/** Reset  */
window.onafterprint = () => {
  buttons.forEach(button => button.classList.remove("hide"));
};
