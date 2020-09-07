const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db")

// Get all invoices
router.get("/", async (req, res, next) => {
    try {
        const results = await db.query("SELECT id, comp_code FROM invoices");
        return res.json({invoices: results.rows})
    } catch (error) {
        return next(error)
    }
})

// Get invoice by id
router.get("/:id", async(req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query(`
        SELECT * FROM invoices
        INNER JOIN companies
        ON invoices.comp_code = companies.code
        WHERE invoices.id = $1`, [id])

        // const result = await db.query(`
        // SELECT  invoices.id AS id, invoices.amt AS amt, invoices.paid AS paid, invoices.add_date AS add_date, 
        //         invoices.paid_date AS paid_date, companies.code AS code, companies.name AS name, companies.description AS description
        // FROM invoices INNER JOIN companies
        // ON invoices.comp_code = companies.code
        // WHERE invoices.id = $1`, [id])
        if (result.rows.length === 0) {
            throw new ExpressError(`Unable to locate record for invoices with id ${id}`, 404)
        }
        const {amt, paid, add_date, paid_date, code, name, description} = result.rows[0];
        return res.json({invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}})
    } catch (error) {
        return next(error)
    }
})

// Create a new invoice
router.post("/", async(req, res, next) => {
    try {
        const {comp_code, amt} = req.body;
        const add_date = new Date()
        const result = await db.query(  `INSERT INTO invoices (comp_code, amt, add_date) 
                                        VALUES ($1, $2, $3) 
                                        RETURNING *`,
                                        [comp_code, amt, add_date]);
        return res.status(201).json({invoice: result.rows[0]})
    } catch (error) {
        return next(error)
    }
})

// Update invoice details
router.patch("/:id", async(req, res, next) => {
    try {
        const {id} = req.params;
        const {amt} = req.body;
        const result = await db.query(  `UPDATE invoices
                                        VALUES SET amt=$2
                                        WHERE id = $1
                                        RETURNING *`,
                                        [id, amt]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Unable to update invoice with id ${id}, record not found`, 404)
        }
        return res.json({invoice: result.rows[0]})
    } catch (error) {
        return next(error)
    }
})

// Delete a invoice
router.delete("/:id", async(req, res, next) => {
    try {
        const {id} = req.params;
        const result = await db.query(  `DELETE FROM invoices
                                        WHERE id = $1
                                        RETURNING id`,
                                        [id]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Unable to delete invoice with id ${id}, record not found`, 404)
        }
        return res.json({ status: "deleted" })
    } catch (error) {
        return next(error)
    }
})

module.exports = router;