const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db")

// Get all companies
router.get("/", async (req, res, next) => {
    try {
        const results = await db.query("SELECT * FROM companies");
        return res.json({companies: results.rows})
    } catch (error) {
        return next(error)
    }
})

// Get company by company_code
router.get("/:code", async(req, res, next) => {
    try {
        const { code } = req.params;
        const result = await db.query(`
            SELECT * FROM companies 
            LEFT JOIN invoices
            ON companies.code = invoices.comp_code
            WHERE code = $1`, [code])
        if (result.rows.length === 0) {
            throw new ExpressError(`Unable to locate record for company with code ${code}`, 404)
        }
        const { name, description } = result.rows[0];
        const invoices = result.rows.map( row => {
                const invoice = {
                id: row.id,
                amt: row.amt,
                paid: row.paid,
                add_date: row.add_date,
                paid_date: row.paid_date};

                return invoice;
            })
        return res.json({company: {
            code: code,
            name: name,
            description: description,
            invoices: invoices
        }});
        // return res.json({company: result})
    } catch (error) {
        return next(error)
    }
})

// Create a new company
router.post("/", async(req, res, next) => {
    try {
        const {code, name, description} = req.body;
        const result = await db.query(  `INSERT INTO companies (code, name, description) 
                                        VALUES ($1, $2, $3) 
                                        RETURNING code, name, description`,
                                        [code, name, description]);
        return res.status(201).json({company: result.rows[0]})
    } catch (error) {
        return next(error)
    }
})

// Update company details
router.patch("/:code", async(req, res, next) => {
    try {
        const {code} = req.params;
        const {name, description} = req.body;
        const result = await db.query(  `UPDATE companies
                                        VALUES SET name=$2, description=$3
                                        WHERE code = $1
                                        RETURNING code, name, description`,
                                        [code, name, description]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Unable to update company with code ${code}, record not found`, 404)
        }
        return res.json({company: result.rows[0]})
    } catch (error) {
        return next(error)
    }
})

// Delete a company
router.delete("/:code", async(req, res, next) => {
    try {
        const {code} = req.params;
        const result = await db.query(  `DELETE FROM companies
                                        WHERE code = $1
                                        RETURNING code`,
                                        [code]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Unable to delete company with code ${code}, record not found`, 404)
        }
        return res.json({ status: "deleted" })
    } catch (error) {
        return next(error)
    }
})

module.exports = router;