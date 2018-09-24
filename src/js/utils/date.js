import MONTH from "./months";
import Common from "./common";

class GetDate {
  constructor() {
    this.date = new Date();
    this.now = null;
    this.sDate = null;
  }

  getNow() {
    const months = this.date.getMonth() + 1;
    const day = this.date.getDate() + 1;
    const year = this.date.getFullYear();

    this.now = new Date(`${months} ${day},${year}`);

    return this.now;
  }
  setDate(date = this.now) {
    this.sDate = new Date(date);
    return this.sDate;
  }
  getPrevDay() {
    let lang = Common.getCookie("_lang");

    let nextDay = this.now || this.date;
    nextDay.setDate(nextDay.getDate() - 1);

    this.setDate(nextDay);

    let day = this.sDate.getDate(),
      month = MONTH[lang || "ka"][this.sDate.getMonth()];

    this.sDate = `${day} ${month}`;

    return this.sDate;
  }
  setFromTo(from, durotation) {
    let lang = Common.getCookie("_lang");

    const start = new Date(from);
    const startMonth = start.getMonth();
    let dates = [];

    dates.push({
      day: start.getDate(),
      month: MONTH[lang][startMonth]
    });

    for (let i = 0; i < durotation; i++) {
      start.setDate(start.getDate() + 1);

      dates.push({
        day: start.getDate(),
        month: MONTH[lang][start.getMonth()]
      });
    }

    return dates;
  }
  changeLang() {
    let rows = document.querySelectorAll(".data"),
      selectedLang = Common.getCookie("_lang");

    if (rows.length !== 0) {
      rows.forEach(row => {
        let el = row.firstChild,
          lang = el.getAttribute("data-lang"),
          date = el.textContent.split(" "),
          day = date[0],
          month = date[1];

        if (selectedLang !== lang) {
          let monthIndex = MONTH[lang].indexOf(month);
          el.textContent = `${day} ${MONTH[selectedLang][monthIndex]}`;
          el.setAttribute("data-lang", selectedLang);
        }
      });
    }
  }
}

export default GetDate;
