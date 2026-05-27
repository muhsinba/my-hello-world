"use client"

import Link from "next/link";
import { useState } from "react";
import { FaDollarSign, FaUser, FaPercentage } from "react-icons/fa";


export default function Home() {
const [bill, setBill] = useState(0);
const [percentage, setPercentage] = useState(0);
const [results, setResults] = useState({tipAmount:0, totalPerPerson:0, total:0});
const [isSplitting, setisSplitting] = useState(false);
const [people, setPeople] = useState(0);
const percantageButtonValues = [5,10,15,20,25,30];

const calculateTip = () => {
  const tipAmount = bill * percentage / 100;
  const total = bill + tipAmount;
  const totalPerPerson = total / people;
  setResults({tipAmount,totalPerPerson, total});
};

const resetAllValues = () => {
  setBill(0);
  setPercentage(0);
  setPeople(0);
  setisSplitting(false);
  setResults({tipAmount:0,total:0,totalPerPerson:0});
};

  return (
<div className="MainContainer">
  <h1 className="title">Tip Calculator</h1>
  <div className="TipCalculator">
    <div className="LeftContainer">
      
        <label> Bill Amount</label>
       <div className="input-with-icon">  
       <FaDollarSign />
       <input 
          type="number"
          value={bill || ""}
          onChange={(e) => setBill(Number(e.target.value))}/>
      </div>
      <div className="percentage-label">
        <label>Tip Percentage</label>  
        <FaPercentage/>
      </div>
      <div className="percentage-buttons">
        {percantageButtonValues.map((val) => {
          return <button
            className={val === percentage ? "selected-button" : ""}
            key={val}
            onClick={()=>setPercentage(val)}
          >{val}%
          </button>;
        }) 
        }   
      </div>

      <div className="splitting-checkbox-container">
      <label className="splitting-checkbox">
        <input type="checkbox"
        checked = {isSplitting}
        onChange={(e)=>setisSplitting(e.target.checked)}
        />
        Split the Bill
      </label>
      </div> 
      
      {isSplitting &&
      <div>
      <label>Number of People</label>
      <div className="input-with-icon">
      <FaUser />
      <input type="number"
      value={people ||""}
      onChange={(e)=> setPeople(Number(e.target.value))}
      />
      </div>
      </div>
      }

      <button onClick={calculateTip} className="calculate-button">Calculate</button>
    </div>
    <div className="RightContainer">
      <div className="result-container">
        <p>Tip</p>
        <p className="result-value">${results.tipAmount.toFixed(2)}</p>
      </div>
      
      {isSplitting && (
      <div className="result-container">
        <p>Bill Per Person</p>
        <p className="result-value">${isFinite(results.totalPerPerson)?results.totalPerPerson.toFixed(2):0}</p>
      </div>
      )}

      <div className="result-container">
        <p>Total Bill</p>
        <p className="result-value">${results.total.toFixed(2)}</p>  
      </div>
      <button onClick={resetAllValues} className="calculate-button" >Reset</button>
    </div>
  </div>
</div>
  );
}
