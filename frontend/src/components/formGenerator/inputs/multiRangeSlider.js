import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import "../css/multiRangeSlider.css";

const MultiRangeSlider = ({ min, max, onChange, sliderTrackColor }) => {
  const [minVal, setMinVal] = useState(min);
  const [maxVal, setMaxVal] = useState(max);

  // Convert to percentage
  const getPercent = useCallback(
    (value) => Math.round(((value - min) / (max - min)) * 100),
    [min, max]
  );

  const minPercent = getPercent(minVal);
  const maxPercent = getPercent(maxVal);

  return (
    <div className="container">
      <input
        type="range"
        id="multiRangeMin"
        name="multiRangeMin"
        aria-label="Min value"
        min={min}
        max={max}
        value={minVal}
        onChange={(event) => {
          const value = Math.min(Number(event.target.value), maxVal - 1);
          setMinVal(value);
          onChange({ min: value, max: maxVal });
        }}
        className="thumb thumb--left"
        style={{ zIndex: minVal > max - 100 && "5" }}
      />
      <input
        type="range"
        id="multiRangeMax"
        name="multiRangeMax"
        aria-label="Max value"
        min={min}
        max={max}
        value={maxVal}
        onChange={(event) => {
          const value = Math.max(Number(event.target.value), minVal + 1);
          setMaxVal(value);
          onChange({ min: minVal, max: value });
        }}
        className="thumb thumb--right"
      />

      <div className="slider">
        <div className="slider__track"/>
        <div className="slider__range" style={{backgroundColor: sliderTrackColor, left: `${minPercent}%`, width: `${maxPercent - minPercent}%`}}/>
        <div className="slider__left-value">{minVal}</div>
        <div className="slider__right-value">{maxVal}</div>
      </div>
    </div>
  );
};

MultiRangeSlider.propTypes = {
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired
};

export default MultiRangeSlider;
