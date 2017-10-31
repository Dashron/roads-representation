"use strict";

let validator = require('validator');

module.exports = class Representation {
    /**
     * 
     * @public
     * @param {object} fieldDefinitions Each field is a fieldname in this representaiton. Each value is an object defining that field. That definition can have a "validator" and "sanitizer" object. In those objects they must have a "method" string, and may have an "options" object.
     */
    constructor (fieldDefinitions) {
        for (let i in fieldDefinitions) {
            let validField = this.ensureValidFieldDefinition(fieldDefinitions[i]);
        
            if (!validField) {
                throw new Error('Invalid field [' + i + ']: ' + validField.message);
            }
        }

        this.fields = {};
        this.fieldDefinitions = fieldDefinitions;
    }

    /**
     * 
     * @public
     * @param {any} fields 
     */
    hydrate (fields) {
        let validationResponse = null;
        let cleanValue = null;
        let errors = {};

        for (let name in fields) {
            // ignore fields without a definition
            if (!this.fieldDefinitions[name]) {
                continue;
            }

            // sanitize first to make sure the final value goes through validation
            cleanValue = this.sanitizeField(this.fieldDefinitions[name], fields[name]);
            validationResponse = this.isValid(this.fieldDefinitions[name], cleanValue);
            
            // if the validation is successful, update this representation with the field
            if (validationResponse === true) {
                this.fields[name] = cleanValue;
            } else {
                // If the validation fails, build an array of errors
                errors[name] = validationResponse;
            }
        }
        console.log('errors', errors);
        // If no fields failed, return true
        if (Object.keys(errors).length === 0) {
            return true;
        }

        // Otherwise return a map of errors
        return errors;
    }

    /**
     * 
     * 
     * @private
     * @param {any} definition 
     * @param {any} value 
     * @returns 
     */
    isValid (definition, value) {
        if (!definition.validators) {
            return true;
        }

        let errors = [];
        let optionsCopy = null;
        let definitionCopy = null;

        for (let i in definition.validators) {
            // We copy the definition so we can provide the definition to the client, and trust that
            // they can make modifications without affecting the original definition
            definitionCopy = JSON.parse(JSON.stringify(definition.validators[i]));

            // We copy the options in case the validator method decides to change the properties (validator 9.1.1 does this);
            if (Array.isArray(definitionCopy.options) || typeof(definitionCopy.options) === "object") {
                optionsCopy = JSON.parse(JSON.stringify(definitionCopy.options));
            } else {
                optionsCopy = definitionCopy.options;
            }

            // Build an array that contains the field definition, and whether or not the value was valid
            errors.push({
                definition: definitionCopy,
                value: value,
                isValid: validator[definitionCopy.method](value, optionsCopy)
            });
        }
        
        // Return a single true value if every field is valid
        if (errors.reduce(function (accumulator, currentValue) {
            return accumulator && currentValue.isValid;
        }, true) === true ) {
            return true;
        }

        // Return an array of details if any field is valid
        return errors;
    }


    /**
     * 
     * 
     * @private
     * @param {any} definition 
     * @param {any} value 
     * @returns 
     */
    sanitizeField (definition, value) {
        if (!definition.sanitizers) {
            return value;
        }

        for (let i in definition.sanitizers) {
            value = validator[definition.sanitizers[i].method](value, definition.sanitizers[i].options);
        }

        return value;
    }

    /**
     * 
     * @private
     * @param {object} fieldDefinition 
     * @returns true|object
     */
    ensureValidFieldDefinition (fieldDefinition) {
        if (fieldDefinition.validators) {
            // Allow users to provide a single item, but always interpret it internally as an array
            if (!Array.isArray(fieldDefinition.validator)) {
                fieldDefinition.validator = [fieldDefinition.validators];
            }
            
            for (let i = 0; i < fieldDefinition.validators.length; i++) {
                let fieldvalidator = fieldDefinition.validators[i];

                if (!fieldvalidator.method) {
                    return {
                        message: "Validator must be an object with a method property."
                    };
                }
                
                if (!validator[fieldvalidator.method]) {
                    return {
                        message: "Validator must be an object with a method property. That method must exist in the \"validator\" package"
                    };
                }
            }
        }


        if (fieldDefinition.sanitizers) {
            // Allow users to provide a single item, but always interpret it internally as an array
            if (!Array.isArray(fieldDefinition.sanitizers)) {
                fieldDefinition.sanitizers = [fieldDefinition.sanitizers];
            }

            for (let i = 0; i < fieldDefinition.sanitizers.length; i++) {
                let fieldsanitizer = fieldDefinition.sanitizers[i];

                if (!fieldsanitizer.method) {
                    return {
                        message: "Sanitizer must be an object with a method property."
                    };
                }

                if (!validator[fieldsanitizer.method]) {
                    return {
                        message: "Sanitizer must be an object with a method property. That method must exist in the \"validator\" package"
                    };
                }
            }
        }

        return true;
    }
};