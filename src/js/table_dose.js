import firebase from "firebase/app";
import Common from "./utils/common";
import db from "./utils/init";

if (location.pathname.endsWith("doses.html")) {
  /** Translate page , by cookie value  */
  Common.translate();

  (async function() {
    const fm = [60, 100, 130, 160, 190, 220, 250, 280, 310, 340, 370, 400, 430];
    const to = [99, 129, 159, 189, 219, 249, 279, 309, 339, 369, 399, 429, 460];
    const docs = await Common.getAllDocs(db, "Doses");
    const dosesRow = document.querySelector(".doses_row");
    const fragment = document.createDocumentFragment();
    const table = document.querySelector("table");
    const addNewBtn = document.querySelector("#new_column");
    const insulins = await Common.getAllDocs(db, "Insulins");
    const addInsulinForm = document.querySelector("#insulin_add_form");

    table.addEventListener("click", handlerUpdateDose);
    addNewBtn.addEventListener("click", addNewColumn);
    addInsulinForm.addEventListener("submit", addInsulin);

    docs.forEach(async doc => {
      let doses = await getDoses(doc);
      let th = document.createElement("th");
      th.className = "inj_time";
      th.setAttribute("data-time", doc);

      th.textContent = doc;
      fragment.appendChild(th);
      dosesRow.appendChild(fragment);

      return insDoseToTable(doses, doc);
    });

    function handlerUpdateDose(e) {
      let doseField = e.target,
        doseType = e.target.getAttribute("data-type"),
        doseValue = doseField.textContent;

      if (doseField.nodeName === "SPAN" && doseField.className === "ins_type") {
        let childCount = doseField.parentNode.children.length;
        let $obj = {
          doseField,
          doseValue,
          doseType,
          childCount,
          insulins
        };

        Common.insertInputAndSelect($obj);
        document.querySelectorAll(".delete_dose").forEach(dose => {
          dose.addEventListener("click", deleteDose);
        });
        document
          .querySelectorAll(".ins_field")
          .forEach(field => field.addEventListener("keyup", updateDose));
      } else if (
        doseField.nodeName === "TH" &&
        doseField.className !== "date"
      ) {
        Common.insertInput(doseField, doseValue);
        document.querySelectorAll(".inj_time").forEach(inj => {
          inj.addEventListener("keyup", updateDoseTime);
          inj.addEventListener("dblclick", deleteDoseTime);
        });
      } else {
        return;
      }
    }

    function addNewColumn() {
      let th = document.createElement("th"),
        doseFields = document.querySelectorAll(".sugars_res");
      th.className = "inj_time";

      Common.insertInput(th, "0:00");
      th.addEventListener("keyup", addDoseTime);

      doseFields.forEach(dose => {
        let td = document.createElement("td");
        let $obj = {
          doseField: td,
          doseValue: 0,
          doseType: null,
          childCount: 0,
          insulins
        };
        let index =
          document.querySelectorAll(".inj_time").length == 0
            ? 0
            : document.querySelectorAll(".inj_time").length;

        td.className = "doses";
        td.setAttribute("data-index", index);

        Common.insertInputAndSelect($obj);
        dose.appendChild(td);
        let inputs = td.firstChild.firstChild.nextSibling;
        inputs.addEventListener("keyup", addDose);
      });

      document.querySelector(".doses_row").appendChild(th);
    }

    function addDose(e) {
      let parent = e.target.parentNode.parentNode,
        fieldValue = e.target.value,
        index = parent.getAttribute("data-index"),
        docTime = document
          .querySelectorAll(".inj_time")
          [index].getAttribute("data-time"),
        trTo = Number(parent.parentNode.getAttribute("data-index")),
        $index = to.indexOf(trTo),
        insulinSelect = e.target.nextElementSibling,
        insType = insulinSelect.options[insulinSelect.selectedIndex].value,
        enterBtn = e.which === 13,
        docRef = db.collection("Doses"),
        escBtn = e.which === 27;

      let $obj = {
        enterBtn,
        escBtn,
        insType,
        docTime,
        fieldValue
      };
      fieldValue = checkDoseValue($obj);

      if (fieldValue) {
        let obj = {};
        parent.textContent = "";
        if (Common.isArray(fieldValue)) {
          insulins.forEach((insulin, idx) => {
            obj[insulin] = changeDoseType(
              fieldValue[idx],
              trTo,
              docTime,
              insulin
            );
            parent.innerHTML += setDose({
              dose: fieldValue[idx],
              idx: $index,
              type: insulin,
              docTime
            });

            obj["type"] = insulins;
          });
        } else {
          parent.innerHTML = setDose({
            dose: fieldValue,
            idx: $index,
            type: insType,
            docTime
          });

          obj[insType] = changeDoseType(fieldValue, trTo, docTime, insType);
          obj["type"] = insType;
        }

        obj["index"] = docs.length;

        docRef.doc(docTime).set(obj);
      } else if (fieldValue !== undefined) {
        parent.textContent = fieldValue;
      }
    }

    function addDoseTime(e) {
      let docTime = changeDoseTime(e, "00:00");
      if (docTime && !docs.includes(docTime)) {
        this.textContent = docTime;
      }
      return docTime;
    }
    function checkDoseValue(obj) {
      let regExp = /^\d{1,2}$/,
        str = insulins.reduce($str => ($str += "\\d{1,2}(\\s+)"), ""),
        regExpFull = new RegExp(`^${str}?$`),
        { enterBtn, docTime, escBtn, insType, fieldValue } = obj;

      if (
        (regExp.test(fieldValue) && enterBtn && docTime) ||
        (insType === "*" && enterBtn && docTime)
      ) {
        if (regExpFull.test(fieldValue)) {
          fieldValue = fieldValue.split(" ");
        } else if (insType === "*" && !Common.isArray(insType)) {
          alert("Enter second value");
          return;
        }
        return fieldValue;
      } else if (escBtn) {
        return "";
      }
    }
    function changeDoseTime(e, oldTime) {
      let newTime,
        value = e.target.value,
        regExpFull = /^\d{1,2}:[0-5]\d$/,
        regExpNum = /^\d{1,2}$/,
        enterBtn = e.which === 13,
        escBtn = e.which === 27;

      if (enterBtn) {
        if (regExpFull.test(value)) {
          const hour = value.split(":")[0];
          if (hour <= 23) {
            newTime = value;
          }
        } else if (regExpNum.test(value) && value <= 23) {
          newTime = `${value}:00`;
        }
      } else if (escBtn && e.target.parentNode) {
        e.target.parentNode.textContent = oldTime;
      }

      e.target.parentNode && newTime !== undefined
        ? e.target.parentNode.setAttribute("data-time", newTime)
        : "";
      return newTime;
    }

    /**
     * Change or create new object
     * with new params
     * @param {String} type
     * @param {String|Number} value
     * @param {String} fromIndex
     */
    function changeDoseType(value, fromIndex, docTime, type) {
      let obj = {};
      let dose = [];

      if (docTime) {
        if (insulins.indexOf(type) !== -1) {
          document.querySelectorAll(".ins_type").forEach(el => {
            if (el.getAttribute("data-time") !== docTime) {
              return;
            }
            if (el.getAttribute("data-type") === type) {
              let $dose = Number(el.getAttribute("data-dose"));
              dose.push($dose);
            }
            return dose;
          });
        }
      }
      obj = fm.map((el, index) => {
        return {
          from: el,
          to: to[index],
          dose:
            fromIndex === to[index]
              ? Number(value)
              : dose[index] !== undefined
                ? Number(dose[index])
                : 0
        };
      });

      return obj;
    }
    function updateOneDose(data, index, type, value) {
      let arr = data[type].map(el => {
        data[type][index].dose = Number(value);
        return el;
      });

      return arr;
    }

    /** Delete the  time */
    function deleteDoseTime() {
      let deletedTime = this.getAttribute("data-time");
      if (confirm("Do you want delete this row ?")) {
        db.collection("Doses")
          .doc(deletedTime)
          .delete()
          .then(_ => location.reload());
      } else {
        return;
      }
    }

    function deleteDose(e) {
      let btn = e.target;
      let docTime = btn.parentNode.parentNode.getAttribute("data-time");
      let prevEl = btn.previousElementSibling;
      let selInsulin = prevEl.options[prevEl.selectedIndex].value;
      let docTimeRef = db.collection("Doses").doc(docTime);

      docTimeRef.get().then(el => {
        let data = el.data();
        let obj = data;
        let type = obj["type"];
        let index = type.indexOf(selInsulin);
        if (index !== -1) {
          type.splice(index, 1);
          type = type.length <= 1 ? type.join() : type;
        }
        obj[selInsulin] = firebase.firestore.FieldValue.delete();
        obj["type"] = type;

        docTimeRef.update(obj).then(_ => location.reload());
      });
    }

    /** Update dose time  */
    function updateDoseTime(e) {
      let oldTime = this.getAttribute("data-time"),
        newTime = changeDoseTime.apply(this, [e, oldTime]);

      if (newTime && !docs.includes(newTime) && oldTime) {
        this.textContent = newTime;
        db.collection("Doses")
          .doc(oldTime)
          .get()
          .then(el => {
            if (el && el.exists) {
              let data = el.data();
              db.collection("Doses")
                .doc(newTime)
                .set(data);

              db.collection("Doses")
                .doc(oldTime)
                .delete();
            }
          });
      } else if (docs.includes(newTime)) {
        alert(`This time ${newTime} almost exist!`);
      } else {
        return;
      }
    }

    function updateDose(e) {
      let fieldValue = e.target.value,
        parent = this.parentNode.parentNode,
        index = parent.getAttribute("data-index"),
        docTime = parent.getAttribute("data-time"),
        docRef = db.collection("Doses").doc(docTime),
        fromIndex = Number(
          parent.parentNode.parentNode.getAttribute("data-index")
        ),
        insulinSelect = this.nextElementSibling,
        insType = insulinSelect.options[insulinSelect.selectedIndex].value,
        enterBtn = e.which === 13,
        escBtn = e.which === 27;

      let $obj = {
        enterBtn,
        escBtn,
        insType,
        docTime,
        fieldValue
      };

      fieldValue = checkDoseValue($obj);

      if (fieldValue) {
        db.collection("Doses")
          .doc(docTime)
          .get()
          .then(el => {
            let data = el.data();
            let obj = {};
            if (Common.isArray(fieldValue)) {
              parent.textContent = "";
              insulins.forEach((insulin, idx) => {
                if (data[insulin] === undefined) {
                  insType = insulins;
                  obj[insulin] = changeDoseType(
                    fieldValue[idx],
                    fromIndex,
                    docTime,
                    insulin
                  );
                } else {
                  obj[insulin] = updateOneDose(
                    data,
                    index,
                    insulin,
                    fieldValue[idx]
                  );
                  obj["type"] = insulins;
                }
              });
              fieldValue.forEach((val, idx) => {
                if (parent.getAttribute("data-type") === insType[idx]) {
                  parent.setAttribute("data-dose", val);
                  parent.textContent = val;
                } else {
                  let newEl = parent.cloneNode();
                  newEl.setAttribute("data-type", insType[idx]);
                  newEl.setAttribute("data-dose", val);
                  newEl.textContent = val;
                  Common.insertAfter(newEl, parent);
                }
              });
              return docRef.update(obj);
            } else {
              obj[insType] = updateOneDose(data, index, insType, fieldValue);
              data[insType] = insType;

              parent.setAttribute("data-dose", fieldValue);
              parent.setAttribute("data-type", insType);
              parent.setAttribute("data-css", insType[0].toUpperCase());

              parent.textContent = fieldValue;

              return docRef.update(obj);
            }
          });
      } else if (fieldValue !== undefined) {
        return (parent.textContent = fieldValue);
      }
    }

    /**
     *  Insert To the table , insulins doses
     *  from db(firestore)
     * @param {Object} doses
     */
    function insDoseToTable(doses, doc) {
      const sugarsRes = document.querySelectorAll(".sugars_res");
      const tdFragment = document.createDocumentFragment();
      sugarsRes.forEach(sugar => {
        let index = sugar.getAttribute("data-index");
        let td = document.createElement("td");
        td.classList.add("doses");

        if (doses[index]) {
          let $type = doses[index].type[0].toUpperCase();
          let dose = doses[index].dose;
          let idx = doses[index].index;
          let obj = {
            dose,
            type: $type,
            doses,
            docTime: doc,
            index,
            idx
          };

          td.innerHTML = setDose(obj);
        } else {
          let insTypes = Object.keys(doses);
          insTypes.forEach(type => {
            let dose = doses[type][index].dose;
            let obj = {
              dose,
              type,
              doses,
              docTime: doc,
              index
            };

            td.innerHTML += setDose(obj);
          });
        }
        tdFragment.appendChild(td);
        sugar.appendChild(tdFragment);
      });
    }

    function setDose(obj) {
      let { doses, docTime, dose, idx, index, type } = obj;
      let el;
      let $type =
        doses !== undefined
          ? doses[index] !== undefined
            ? doses[index].type
            : type
          : type;
      let $index = idx !== undefined ? idx : doses[type][index].index;
      let hasDose = dose && dose !== 0 ? `data-dose="${dose}"` : "";

      el = `<span class="ins_type"
                  data-css="${dose ? type[0].toUpperCase() : ""}"
                  data-time="${docTime}"
                  data-index="${$index}"
                  data-type="${$type}"
                  ${hasDose}>
                  ${dose !== 0 ? dose : ""}
            </span>`;
      return el;
    }

    /**
     * Get all doses from db and return object
     * @param {String} doc
     */
    async function getDoses(doc) {
      let obj = {};
      return await db
        .collection("Doses")
        .doc(doc)
        .get()
        .then(el => {
          const data = el.data();
          const type = data.type;
          if (typeof type === "string") {
            let doses = data[type];
            doses.forEach((dose, idx) => {
              let $obj = { dose: dose.dose, type, index: idx };
              obj[dose.to] = $obj;
            });
          } else {
            type.forEach(ins => {
              let a = {};
              data[ins].forEach((dose, idx) => {
                let $obj = {
                  dose: dose.dose,
                  index: idx
                };
                a[dose.to] = $obj;
                obj[ins] = a;
              });
            });
          }
          return obj;
        });
    }

    /** Insert all insulins which was in db to the page*/
    (function() {
      const list = document.querySelector("#insulins_list"),
        row = document.querySelector(".row"),
        fragment = document.createDocumentFragment();
      insulins.forEach(insulin => {
        let li = document.createElement("li");
        li.className = "insulins_list_item";
        li.dataset.insulin = insulin;
        li.textContent = Common.capitalize(insulin);
        li.addEventListener("click", removeInsulin);
        77;
        fragment.appendChild(li);
      });
      list.appendChild(fragment);

      docs.forEach(doc => {
        const elem = `<div class="empty">
          <div class="fill" draggable="true">${doc}</div>
        </div>`;
        row.innerHTML += elem;
      });
    })();

    /** Drag and drop , from sorting time */
    const empties = document.querySelectorAll(".empty");
    const fills = document.querySelectorAll(".fill");

    empties.forEach(async empty => {
      empty.addEventListener("dragover", dragOver);
      empty.addEventListener("drop", drop);
    });

    fills.forEach((fill, idx) => {
      fill.id = `index_${idx}`;
      fill.addEventListener("dragstart", dragStart);
      fill.addEventListener("dragend", e => (e.target.className = "fill"));
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
        dosesRef = db.collection("Doses");

      e.currentTarget.replaceChild(data, tgt);
      srcParent.appendChild(tgt);

      empties.forEach(empty => {
        let value = empty.firstElementChild.textContent;
        docs.sort((doc, idx) => {
          return doc.indexOf(value) !== doc.indexOf(idx);
        });
      });

      docs.forEach((doc, idx) => {
        const docRef = dosesRef.doc(doc);
        docRef.get().then(el => {
          if (el.exists) {
            const data = el.data();
            data["index"] = idx;
            docRef.update(data);
          }
        });
      });
    }

    /** Add new insulin */
    function addInsulin(e) {
      e.preventDefault();
      const inputValue = e.target.firstChild.nextElementSibling.value.toLowerCase();
      if (insulins.includes(inputValue)) {
        Common.handler.call(
          e.target,
          `Error! The ${inputValue} is almost exists`
        );
      } else {
        db.collection("Insulins")
          .doc(inputValue)
          .set({})
          .then(() => {
            Common.handler.call(
              e.target,
              `${inputValue} was added successfully`,
              false
            );
            return setTimeout(() => location.reload(), 1500);
          });
      }
    }

    /** Remove insulin */
    function removeInsulin(e) {
      const selInsulin = e.target.dataset.insulin;
      if (confirm(`Do you want to delete ${selInsulin} ?`)) {
        let dosesRef = db.collection("Doses"),
          insulinsRef = db.collection("Insulins");
        docs.forEach(doc => {
          dosesRef
            .doc(doc)
            .get()
            .then(el => {
              let data = el.data(),
                docTime = el.id,
                type =
                  data.type === selInsulin || data.type.includes(selInsulin),
                $type = data.type;
              if (type) {
                data[selInsulin] = firebase.firestore.FieldValue.delete();
                if (Common.isArray($type)) {
                  let index = $type.indexOf(selInsulin);
                  $type.splice(index, 1);
                  dosesRef.doc(docTime).update(data);
                } else {
                  dosesRef.doc(docTime).delete();
                }
              }
              return;
            });
        });
        insulinsRef.doc(selInsulin).delete();
        setTimeout(() => location.reload(), 1000);
      }
    }
  })();
}
