"use strict";
const Representation = require('../src/representation.js');
//TODO Add array tests for ensureValidField

/**
 * Constructor tests
 */
exports.testConstructorValidFieldsPasses = function (test) {
    let UserRepresentation = new Representation({
        name: {
            validators: [{
                method: "isLength",
                options: {
                    min: 0,
                    max: 10
                }
            }]
        },
        uri: {
            validators: [{
                method: "isURL",
                options: {
                    require_tld: false,
                    require_protocol: false,
                    require_host: false,
                    require_valid_protocol: false, 
                }
            }]

        }
    });
	test.done();
};

exports.testConstructorInvalidFieldsThrows = function (test) {
    let UserRepresentation = new Representation({
        name: {
            validators: [{
                method: "hfewlkjewlhfwe",
            }]
        }
    });
	test.done();
};

/**
 * Hydrate tests
 */

exports['Test Hydrate Ignores Unknown Fields'] = function (test) {
    let rep = new Representation({
        name: {
            validators: [{
                method: 'isBoolean'
            }]
        }
    });

    test.strictEqual(rep.hydrate({
        ewlwafeljewl: true
    }), true);

    test.deepEqual(rep.fields, {});
    test.done();
};

exports['Test Hydrate Accepts valid Data'] = function (test) {
    let rep = new Representation({
        isStaff: {
            validators: [{
                method: 'isBoolean'
            }]
        }
    });

    test.strictEqual(rep.hydrate({
        // validator only accepts strings. That seems like a pretty big oversight on my part. Should we keep
        //going down this path and decide if I shold make this 'true', or add basic non-string support to
        // the core library, or should we start to find a different validator
        isStaff: true
    }), true);

    test.strictEqual(rep.fields.isStaff, true);
    test.done();
};

exports['Test Hydrate Rejects invalid Data'] = function (test) {
    let rep = new Representation({
        isStaff: {
            validators: [{
                method: 'isBoolean'
            }]
        }
    });

    test.equal(rep.hydrate({
        isStaff: 'abcde'
    }), {
        isStaff: {
            definition: [{
                method: 'isBoolean'
            }],
            value: 'abcde', 
            isValid: false
        }
    });

    test.strictEqual(rep.fields.isStaff, undefined);
    test.done();
};

exports['Test Hydrate Rejects Works'] = function (test) {
    let rep = new Representation({
        isStaff: {
            sanitizers: [{
                method: 'rtrim'
            }], 
            validators: [{
                method: 'isBoolean'
            }]
        }
    });

    rep.hydrate({
        isStaff: '1    '
    });

    test.strictEqual(rep.fields.isStaff, true);
    test.done();
};

exports['Test Sanitization happens before validation'] = function (test) {
    // Prove that it works when provided in the right order
    let rep = new Representation({
        name: {
            sanitizers: [{
                method: 'rtrim'
            }], 
            validators: [{
                method: 'isBoolean'
            }]
        }
    });

    rep.hydrate({
        
    });

    // Prove that it does not work in the wrong order
    let rep2 = new Representation({
        name: {
            sanitizers: [{
                method: 'rtrim'
            }, { 
                method: 'toBoolean', 
                options: true 
            }], 
            validators: [{
                method: 'isBoolean'
            }]
        }
    });

    rep2.hydrate({
        
    });
    

	test.done();
};

/**
 *  Is Valid test
*/
exports['Test No Validation Definition always returns true'] = function (test) {
    let val = 'abcdefg';
    let rep = new Representation();
    test.strictEqual(rep.isValid({}, val), true);
	test.done();
};

exports['Test Passing Validation Methods return true'] = function (test) {
    let val = 'true';
    let rep = new Representation();

    test.strictEqual(rep.isValid({
        validators: [{ 
            method: 'isBoolean'
        }]
    }, val), true);

	test.done();
};

exports['Test Invalid Validation Methods return properly'] = function (test) {
    let val = 'abcdefg';
    let rep = new Representation();

    test.deepEqual(rep.isValid({
        validators: [{ 
            method: 'isBoolean'
        }]
    }, val), [{ 
        definition: {
            method: 'isBoolean'
        },
        value: val,
        isValid: false
    }]);

	test.done();
};

exports['Test Passing Validation Methods with options return true'] = function (test) {
    let val = '1.01';
    let rep = new Representation();

    test.deepEqual(rep.isValid({
        validators: [{ 
            method: 'isDecimal', 
            options: {
                decimal_digits: 2
            }
        }]
    }, val), true);

	test.done();
};

exports['Test Invalid Validation Methods with options return properly'] = function (test) {
    let val = '1.01';
    let rep = new Representation();

    test.deepEqual(rep.isValid({
        validators: [{ 
            method: 'isDecimal', 
            options: {
                decimal_digits: 1
            }
        }]
    }, val), [{ 
        definition: {
            method: 'isDecimal', 
            options: {decimal_digits: 1}
        },
        value: val,
        isValid: false
    }]);

	test.done();
};

exports['Test Multiple Validation Methods Work'] = function (test) {
    let val = '12345';
    let rep = new Representation();
    // test that both pass
    test.deepEqual(rep.isValid({
        validators: [{
            method: 'isInt'
        }, { 
            method: 'isLength', 
            options: {
                min:5, 
                max:5
            }
        }]
    }, val), true);

    // test that the first can pass and the second can fail
    test.deepEqual(rep.isValid({
        validators: [{
            method: 'isInt'
        }, { 
            method: 'isLength', 
            options: {
                min:6, 
                max:6
            } 
        }]
    }, val), [{ 
        definition: {
            method: 'isInt'
        },
        value: val,
        isValid: true
    }, { 
        definition: { 
            method: 'isLength', 
            options: {
                min:6, 
                max:6
            } 
        },
        value: val,
        isValid: false
    }]);

    // test that the first can fail and the second can pass
    test.deepEqual(rep.isValid({
        validators: [{
            method: 'isBoolean'
        }, { 
            method: 'isLength', 
            options: {
                min:5, 
                max:5
            } 
        }]
    }, val), [{ 
        definition: {
            method: 'isBoolean'
        },
        value: val,
        isValid: false
    }, { 
        definition: { 
            method: 'isLength', 
            options: {
                min:5, 
                max:5
            } 
        },
        value: val,
        isValid: true
    }]);

    // test that both can fail
    test.deepEqual(rep.isValid({
        validators: [{
            method: 'isBoolean'
        }, { 
            method: 'isLength', 
            options: {
                min:6, 
                max:6
            } 
        }]
    }, val), [{ 
        definition: {
            method: 'isBoolean'
        },
        value: val,
        isValid: false
    }, { 
        definition: { 
            method: 'isLength', 
            options: {
                min:6, 
                max:6
            } 
        },
        value: val,
        isValid: false
    }]);

	test.done();
};


/**
 * Sanitize Field test
 */
exports['Test No Sanitization Definition Returns Original'] = function (test) {
    let val = 'abcdefg';
    let rep = new Representation();
    test.strictEqual(rep.sanitizeField({}, val), val);
	test.done();
};

exports['Test Sanitization Methods Work'] = function (test) {
    let val = '1';
    let rep = new Representation();
    test.strictEqual(rep.sanitizeField({sanitizers: [{ method: 'toBoolean'}]}, val), true);
	test.done();
};

exports['Test Sanitization Methods Work With Options'] = function (test) {
    let val = 'truthy value';
    let rep = new Representation();
    test.strictEqual(rep.sanitizeField({sanitizers: [{ method: 'toBoolean', options: true }]}, val), false);
	test.done();
};

exports['Test Multiple Sanitization Methods Work'] = function (test) {
    let val = '1    ';
    let rep = new Representation();
    // ensure that a 1 with spaces is false when strictly converted to boolean. 
    test.strictEqual(rep.sanitizeField({
        sanitizers: [{ 
            method: 'toBoolean', 
            options: true 
        }]}, val), false);

    // ensure that a 1 with spaces can be trimmed to a 1
    test.strictEqual(rep.sanitizeField({
        sanitizers: [{
            method: 'rtrim'
        }]}, val), '1');

    // ensure that a 1 with spaces can be trimmed and then strictly converted to a boolean
    test.strictEqual(rep.sanitizeField({
        sanitizers: [{
            method: 'rtrim'
        }, { 
            method: 'toBoolean', 
            options: true 
        }]
    }, val), true);
    
    // ensure that order matters
    test.throws(function () {
        rep.sanitizeField({
            sanitizers: [{ 
                method: 'toBoolean', 
                options: true 
            }, {
                method: 'rtrim'
            }]
        }, val);
    });

	test.done();
};

/**
 * Successful validator
 */
exports['Test Ensure Valid Field Definition returns true for proper validation methods'] = function (test) {
    let rep = new Representation();
    test.strictEqual(rep.ensureValidFieldDefinition({
        validators: [{
            method: 'equals'
        }]
    }), true);


	test.done();
};

exports['Test Ensure Valid Field Definition returns true for an array of proper validation methods'] = function (test) {
    let rep = new Representation();
    test.strictEqual(rep.ensureValidFieldDefinition({
        validators: [{
            method: 'equals'
        }, {
            method: 'isNumeric'
        }]
    }), true);


	test.done();
};


/**
 * Failed validator
 */
exports['Test Ensure Valid Field Definition returns false for invalid validator methods'] = function (test) {
    let rep = new Representation();
    test.strictEqual(rep.ensureValidFieldDefinition({
        validators: [{}]
    }).message, "Validator must be an object with a method property.");


	test.done();
};

exports['Test Ensure Valid Field Definition returns false for invalid validator methods'] = function (test) {
    let rep = new Representation();
    test.strictEqual(rep.ensureValidFieldDefinition({
        validators: [{
            method: 'awfhlaewoiwaef'
        }]
    }).message, "Validator must be an object with a method property. That method must exist in the \"validator\" package");


	test.done();
};


/**
 * Successful sanitizer
 */
exports['Test Ensure Valid Field Definition returns true for proper sanitization methods'] = function (test) {
    let rep = new Representation();
    test.strictEqual(rep.ensureValidFieldDefinition({
        sanitizers: [{
            method: 'equals'
        }]
    }), true);


	test.done();
};

exports['Test Ensure Valid Field Definition returns true for an array of proper sanitization methods'] = function (test) {
    let rep = new Representation();
    test.strictEqual(rep.ensureValidFieldDefinition({
        sanitizers: [{
            method: 'equals'
        }, {
            method: 'trim'
        }]
    }), true);


	test.done();
};

/**
 * Failed sanitizer
 */
exports['Test Ensure Valid Field Definition returns false for invalid sanitization methods'] = function (test) {
    let rep = new Representation();
    test.strictEqual(rep.ensureValidFieldDefinition({
        sanitizers: [{}]
    }).message, "Sanitizer must be an object with a method property.");


	test.done();
};

exports['Test Ensure Valid Field Definition returns false for invalid sanitization methods'] = function (test) {
    let rep = new Representation();
    test.strictEqual(rep.ensureValidFieldDefinition({
        sanitizers: [{
            method: 'awfhlaewoiwaef'
        }]
    }).message, "Sanitizer must be an object with a method property. That method must exist in the \"validator\" package");


	test.done();
};