import MONTH from "./months";

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
    let nextDay = this.now || this.date;
    nextDay.setDate(nextDay.getDate() - 1);

    this.setDate(nextDay);

    let day = this.sDate.getDate(),
      month = MONTH[this.sDate.getMonth()];

    this.sDate = `${day} ${month}`;

    return this.sDate;
  }
  setFromTo(from, durotation) {
    const start = new Date(from);
    const startMonth = start.getMonth();
    let dates = [];

    dates.push({
      day: start.getDate(),
      month: MONTH[startMonth]
    });

    for (let i = 0; i < durotation; i++) {
      start.setDate(start.getDate() + 1);

      dates.push({
        day: start.getDate(),
        month: MONTH[start.getMonth()]
      });
    }

    return dates;
  }
}

export default GetDate;
