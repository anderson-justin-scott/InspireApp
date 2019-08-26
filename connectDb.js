// This file will populate some initial contact documents into the database

const mongoose = require('mongoose');
const credentials = require('./credentials.js');

const dbUrl = 'mongodb://' + credentials.host + ':27017/' + credentials.database;
const connection = mongoose.createConnection(dbUrl);

const ContactDb = require('./contactDb.js');
const Contact = ContactDb.getModel(connection);

connection.on("open", () => {
    // Clear old data
    Contact.remove({}, err => {
        if (err) throw err;
    });

    // Create and save document objects
    let contact;

    contact = new Contact({
        firstName: 'Elton',
        lastName: 'John',
        email: 'ejohn@gmail.com',
        tweet1: 'therealdonaldtrump',
        tweet2: "",
        tweet3: "",
        background: 'Motivational'
    });
    contact.save();

    contact = new Contact({
        firstName: 'Steven',
        lastName: 'Tyler',
        email: 'styler@aerosmith.com',
        tweet1: 'billgates',
        tweet2: "BarackObama",
        tweet3: "",
        background: 'Demotivational'
    });
    contact.save();

    contact = new Contact({
        firstName: 'Robert',
        lastName: 'Plant',
        email: 'rp@ledzep.com',
        tweet1: 'elonmusk',
        tweet2: "",
        tweet3: "",
        background: 'Motivational'
    });
    // On final save check for errors
    contact.save((err) => {
        connection.close();
        if (err) throw err;
        console.log("Success!");
    });

});