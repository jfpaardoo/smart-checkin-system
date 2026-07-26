import PropTypes from 'prop-types';
import MultiRangeSlider from './inputs/multiRangeSlider';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileEncode from 'filepond-plugin-file-encode';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import GlassDropdown from '../GlassDropdown';

const validateValue = (value, validators = []) => {
    if (!validators) return [];
    return validators
        .filter(v => v && !v.validate(value))
        .map(v => v.message);
};

const FormInput = forwardRef(({ 
    tag = "default", 
    name = "default", 
    type = "text", 
    defaultValue = "", 
    values = [], 
    isRequired = false, 
    numberOfColumns = 1, 
    validators = [], 
    minValue = 0, 
    maxValue = 100, 
    onChange = null, 
    disabled = false 
}, ref) => {
                        
    const [inputErrors, setInputErrors] = useState([]);
    let [files, setFiles] = useState([]);
    let [minInputValue, setMinInputValue] = useState(minValue);
    let [maxInputValue, setMaxInputValue] = useState(maxValue);
    let [selectedValue, setSelectedValue] = useState(defaultValue || "");
    let inputField = useRef(null);

    useImperativeHandle(ref, () => {
        return {
            setErrors: (errors) => setInputErrors(errors),
            value: inputField.current ? inputField.current.value : "",
            min: minInputValue,
            max: maxInputValue,
            files: files,
        };
    });

    const handleFiles = (fileItems) => setFiles(fileItems);

    useEffect(() => {
        if(type !== "interval" && type !== "files" && inputField.current){
            const handleChange = () => {
                const errors = validateValue(inputField.current.value, validators);
                setInputErrors(errors);
                if(onChange) {
                    onChange({value: inputField.current.value});
                }
            };

            const currentInput = inputField.current;
            currentInput.addEventListener("change", handleChange);
            return () => {
                if (currentInput) currentInput.removeEventListener("change", handleChange);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    switch(type){

        case "select": {
            const selectOptions = values ? values.map((val) => {
                if (typeof val === 'object' && val !== null) {
                    return { value: val.value || val.id || val.name, label: val.label || val.name || val.value };
                }
                return { value: val, label: String(val) };
            }) : [];

            return(
                <div className={`class-form-group ${inputErrors.length>0 ? "class-error-form" : ""}`} id={`${name}_form`} style={numberOfColumns>1 ? {paddingTop: `2%`, width: `${100/numberOfColumns-3}%`} : {marginTop: `20px`}}>	
                    <input type="hidden" name={name} id={name} value={selectedValue} ref={inputField} />
                    <label htmlFor={`${name}`} className="class-form-label mb-2" style={{ position: 'static', display: 'block', transform: 'none', color: '#2c3e50', fontWeight: 600 }}>{tag}:</label>
                    <GlassDropdown
                        options={selectOptions}
                        value={selectedValue}
                        disabled={disabled}
                        onChange={(val) => {
                            setSelectedValue(val);
                            if (inputField.current) {
                                inputField.current.value = val;
                                inputField.current.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }}
                        placeholder={`Seleccionar ${tag}...`}
                    />
                    {
                        inputErrors.length > 0 && inputErrors.map((error, index) => {
                            return(<span key={`error-${error}-${index}`} className="class-error-message">{error}</span>)
                        })
                    }
                </div>
            );
        }
        
        case "textarea":

            return(
                <div className={`class-form-group ${inputErrors.length>0 ? "class-error-form" : ""}`} id={`${name}_form`} style={{width: `100%`}}>	
                    <textarea className="class-form-input" disabled={disabled} type={type} id={`${name}`} name={`${name}`} placeholder=" " defaultValue={defaultValue || ""} required={isRequired} ref={inputField}/>
                    <label htmlFor={`${name}`} className="class-form-label">{tag}:</label>
                    {
                        inputErrors.length > 0 && inputErrors.map((error, index) => {
                            return(<span key={`err-ta-${error}-${index}`} className="class-error-message">{error}</span>)
                        })
                    }
                </div>
            );

        case "interval":

            return(
                <div className={`class-form-group interval-group d-flex justify-content-evenly ${inputErrors.length>0 ? "class-error-form" : ""}`} id={`${name}_form`} style={numberOfColumns>1 ? {width: `${100/numberOfColumns-3}%`} : {}}>	
                    <label htmlFor={`${name}`} className="class-form-label">{tag}:</label>
                    <MultiRangeSlider
                                min={minValue}
                                max={maxValue}
                                onChange={({min, max})=>{
                                    setMinInputValue(min);
                                    setMaxInputValue(max);
                                }}
                            />
                </div>
            );

        case "files":

            registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview, FilePondPluginFileEncode);

            return(
                <div className={`class-form-group files-group`} id={`${name}_form`} style={{paddingTop: `2%`, width: `100%`}}>	
                    <label htmlFor={`${name}`} className="class-form-label">{tag}:</label>
                    <FilePond 
                        files={files}
                        onupdatefiles={handleFiles}
                        allowMultiple={true}
                        allowReorder={true}
                        maxFiles={10}
                        name={name}
                        labelIdle='Arrastra tus archivos o <span class="filepond--label-action">Selecciona</span>'
                        credits={false}
                    />
                </div>
            );
        
        case "date":
            
            return(
                <div className={`class-form-group ${inputErrors.length>0 ? "class-error-form" : ""}`} id={`${name}_form`} style={numberOfColumns>1 ? {paddingTop: `2%`, width: `${100/numberOfColumns-3}%`} : {}}>	
                    <input className="class-form-input" disabled={disabled} type="date" id={`${name}`} name={`${name}`} required={isRequired} defaultValue={defaultValue} ref={inputField} />
                    <label htmlFor={`${name}`} className="class-form-label" style={numberOfColumns>1 ? {paddingLeft: `1%`} : {}}>{tag}:</label>
                    {
                        inputErrors.length > 0 && inputErrors.map((error, index) => {
                            return(<span key={`err-dt-${error}-${index}`} className="class-error-message">{error}</span>)
                        })
                    }
                </div>
            );

        default:
            return(
                <div className={`class-form-group ${inputErrors.length>0 ? "class-error-form" : ""}`} id={`${name}_form`} style={numberOfColumns>1 ? {width: `${100/numberOfColumns-3}%`} : {}}>	
                    <input className="class-form-input" disabled={disabled} type={type} id={`${name}`} name={`${name}`} placeholder=" " defaultValue={defaultValue || ""} required={isRequired} ref={inputField}/>
                    <label htmlFor={`${name}`} className="class-form-label">{tag}:</label>
                    {
                        inputErrors.length > 0 && inputErrors.map((error, index) => {
                            return(<span key={`err-def-${error}-${index}`} className="class-error-message">{error}</span>)
                        })
                    }
                </div>
            );
    }
});

FormInput.propTypes = {
    tag: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.oneOf(["text", "password", "email", "number", "select", "textarea", "interval", "files", "date", "flatter-tags", "datetime-local"]),
    values: PropTypes.array,
    defaultValue: PropTypes.string,
    isRequired: PropTypes.bool,
    minValue: PropTypes.number,
    maxValue: PropTypes.number,
    numberOfColumns: PropTypes.number,
    validators: PropTypes.array,
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
};

export default FormInput;