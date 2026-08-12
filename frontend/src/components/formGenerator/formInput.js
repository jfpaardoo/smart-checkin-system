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
    return validators.reduce((acc, v) => {
        if (v && !v.validate(value)) {
            acc.push(v.message);
        }
        return acc;
    }, []);
};

const RenderErrors = ({ errors, prefix }) => {
    if (!errors || errors.length === 0) return null;
    return errors.map((error, index) => (
        <span key={`${prefix}-${error}-${index}`} className="class-error-message">{error}</span>
    ));
};

const SelectInput = ({ values, inputErrors, name, numberOfColumns, tag, disabled, inputField, selectedValue, setSelectedValue }) => {
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
            <RenderErrors errors={inputErrors} prefix="error" />
        </div>
    );
};

const TextareaInput = ({ type, inputErrors, name, tag, disabled, inputField, defaultValue, isRequired }) => (
    <div className={`class-form-group ${inputErrors.length>0 ? "class-error-form" : ""}`} id={`${name}_form`} style={{width: `100%`}}>	
        <textarea className="class-form-input" disabled={disabled} type={type} id={`${name}`} name={`${name}`} placeholder=" " defaultValue={defaultValue || ""} required={isRequired} ref={inputField}/>
        <label htmlFor={`${name}`} className="class-form-label">{tag}:</label>
        <RenderErrors errors={inputErrors} prefix="err-ta" />
    </div>
);

const IntervalInput = ({ inputErrors, name, numberOfColumns, tag, minValue, maxValue, setMinInputValue, setMaxInputValue }) => (
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

registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview, FilePondPluginFileEncode);
const FilesInput = ({ name, tag, files, handleFiles }) => (
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

const DateInput = ({ inputErrors, name, numberOfColumns, tag, disabled, inputField, defaultValue, isRequired }) => (
    <div className={`class-form-group ${inputErrors.length>0 ? "class-error-form" : ""}`} id={`${name}_form`} style={numberOfColumns>1 ? {paddingTop: `2%`, width: `${100/numberOfColumns-3}%`} : {}}>	
        <input className="class-form-input" disabled={disabled} type="date" id={`${name}`} name={`${name}`} required={isRequired} defaultValue={defaultValue} ref={inputField} />
        <label htmlFor={`${name}`} className="class-form-label" style={numberOfColumns>1 ? {paddingLeft: `1%`} : {}}>{tag}:</label>
        <RenderErrors errors={inputErrors} prefix="err-dt" />
    </div>
);

const DefaultInput = ({ type, inputErrors, name, numberOfColumns, tag, disabled, inputField, defaultValue, isRequired }) => (
    <div className={`class-form-group ${inputErrors.length>0 ? "class-error-form" : ""}`} id={`${name}_form`} style={numberOfColumns>1 ? {width: `${100/numberOfColumns-3}%`} : {}}>	
        <input className="class-form-input" disabled={disabled} type={type} id={`${name}`} name={`${name}`} placeholder=" " defaultValue={defaultValue || ""} required={isRequired} ref={inputField}/>
        <label htmlFor={`${name}`} className="class-form-label">{tag}:</label>
        <RenderErrors errors={inputErrors} prefix="err-def" />
    </div>
);

const FormInput = forwardRef(({ tag = "default", name = "default", type = "text", defaultValue = "", values = [], isRequired = false, numberOfColumns = 1, validators = [], minValue = 0, maxValue = 100, onChange = null, disabled = false }, ref) => {

    const [inputErrors, setInputErrors] = useState([]);
    const inputField = useRef(null);

    const [files, setFiles] = useState([]);
    const [minInputValue, setMinInputValue] = useState(minValue);
    const [maxInputValue, setMaxInputValue] = useState(maxValue);
    
    const [selectedValue, setSelectedValue] = useState(defaultValue || "");

    const handleFiles = (fileItems) => {
        setFiles(fileItems);
        onChange?.(fileItems.map(fileItem => fileItem.file));
    }

    useImperativeHandle(ref, () => {
        return{
            setErrors: (errors) => {
                setInputErrors(errors);
            },
            clearErrors: () => {
                setInputErrors([]);
            },
            getFiles: () => {
                if (type==="files"){
                    return files;
                }else return null;
            },
            get value() {
                return inputField.current ? inputField.current.value : "";
            },
            get min() {
                return minInputValue;
            },
            get max() {
                return maxInputValue;
            },
            get files() {
                return files;
            }
        }
    });

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

    useEffect(() => {
        if(type === "interval"){
            if(inputField.current) {
                inputField.current.value = [minInputValue, maxInputValue];
                inputField.current.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minInputValue, maxInputValue, inputField]);

    const commonProps = { inputErrors, name, numberOfColumns, tag, disabled, inputField, defaultValue, isRequired };

    switch(type) {
        case "select":
            return <SelectInput {...commonProps} values={values} selectedValue={selectedValue} setSelectedValue={setSelectedValue} />;
        case "textarea":
            return <TextareaInput {...commonProps} type={type} />;
        case "interval":
            return <IntervalInput {...commonProps} minValue={minValue} maxValue={maxValue} setMinInputValue={setMinInputValue} setMaxInputValue={setMaxInputValue} />;
        case "files":
            return <FilesInput name={name} tag={tag} files={files} handleFiles={handleFiles} />;
        case "date":
            return <DateInput {...commonProps} />;
        default:
            return <DefaultInput {...commonProps} type={type} />;
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