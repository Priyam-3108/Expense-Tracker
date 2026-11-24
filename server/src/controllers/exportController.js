import mongoose from 'mongoose';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Expense } from '../config/models/index.js';

// Helper to validate date string
const validateDateString = (dateStr) => {
    if (!dateStr) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const exportExpenses = async (req, res) => {
    try {
        const { format = 'csv', startDate, endDate, search, category, type } = req.query;

        // Build filter object (similar to getExpenses)
        const filter = { user: req.user._id };

        if (category && category !== 'all') {
            try {
                filter.category = new mongoose.Types.ObjectId(category);
            } catch (error) {
                // Ignore invalid category for export, or handle as error
                console.warn('Invalid category in export:', category);
            }
        }

        if (type && type !== 'all') filter.type = type;

        if (startDate && endDate) {
            filter.date = {
                $gte: validateDateString(startDate),
                $lte: validateDateString(endDate)
            };
        }

        if (search) {
            filter.$or = [
                { description: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ];
        }

        // Fetch expenses
        const expenses = await Expense.find(filter)
            .populate('category', 'name')
            .sort({ date: -1 });

        const filename = `expenses-${new Date().toISOString().split('T')[0]}`;

        if (format === 'csv') {
            const fields = [
                { label: 'date', value: 'date' },
                { label: 'category', value: 'category.name' },
                { label: 'description', value: 'description' },
                { label: 'amount', value: 'amount' },
                { label: 'type', value: 'type' },
                { label: 'notes', value: 'notes' }
            ];
            const opts = { fields };
            const parser = new Parser(opts);
            const csv = parser.parse(expenses);

            res.header('Content-Type', 'text/csv');
            res.header('Content-Disposition', `attachment; filename="${filename}.csv"`);
            return res.send(csv);

        } else if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Expenses');

            worksheet.columns = [
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Category', key: 'category', width: 20 },
                { header: 'Description', key: 'description', width: 30 },
                { header: 'Amount', key: 'amount', width: 15 },
                { header: 'Type', key: 'type', width: 10 },
                { header: 'Notes', key: 'notes', width: 30 }
            ];

            expenses.forEach(expense => {
                worksheet.addRow({
                    date: expense.date,
                    category: expense.category?.name || 'Uncategorized',
                    description: expense.description,
                    amount: expense.amount,
                    type: expense.type,
                    notes: expense.notes
                });
            });

            res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.header('Content-Disposition', `attachment; filename="${filename}.xlsx"`);

            await workbook.xlsx.write(res);
            return res.end();

        } else if (format === 'pdf') {
            const doc = new PDFDocument();

            res.header('Content-Type', 'application/pdf');
            res.header('Content-Disposition', `attachment; filename="${filename}.pdf"`);

            doc.pipe(res);

            doc.fontSize(20).text('Expense Report', { align: 'center' });
            doc.moveDown();

            if (startDate && endDate) {
                doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
                doc.moveDown();
            }

            // Simple table-like structure
            const startX = 50;
            let currentY = doc.y;

            // Headers
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Date', startX, currentY);
            doc.text('Category', startX + 80, currentY);
            doc.text('Description', startX + 180, currentY);
            doc.text('Amount', startX + 380, currentY);
            doc.text('Type', startX + 450, currentY);

            currentY += 20;
            doc.font('Helvetica').fontSize(10);

            expenses.forEach(expense => {
                if (currentY > 700) {
                    doc.addPage();
                    currentY = 50;
                }

                doc.text(expense.date?.toString().split('T')[0] || '', startX, currentY);
                doc.text(expense.category?.name || '-', startX + 80, currentY);
                doc.text(expense.description || '-', startX + 180, currentY, { width: 190 });
                doc.text(expense.amount?.toString() || '0', startX + 380, currentY);
                doc.text(expense.type || '-', startX + 450, currentY);

                currentY += 20;
            });

            // Summary
            doc.moveDown();
            const totalExpense = expenses
                .filter(e => e.type === 'expense')
                .reduce((sum, e) => sum + e.amount, 0);
            const totalIncome = expenses
                .filter(e => e.type === 'income')
                .reduce((sum, e) => sum + e.amount, 0);

            doc.font('Helvetica-Bold');
            doc.text(`Total Expenses: ${totalExpense.toFixed(2)}`, { align: 'right' });
            doc.text(`Total Income: ${totalIncome.toFixed(2)}`, { align: 'right' });
            doc.text(`Net: ${(totalIncome - totalExpense).toFixed(2)}`, { align: 'right' });

            doc.end();
            return;
        }

        return res.status(400).json({ success: false, message: 'Invalid format' });

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: 'Export failed', error: error.message });
    }
};
