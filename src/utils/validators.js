const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().min(6).max(128).required(),
  name: Joi.string().max(255).default(''),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().required(),
});

const profileUpdateSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  preferred_currency: Joi.string().length(3).uppercase().optional(),
  notification_email: Joi.boolean().optional(),
});

const categorySchema = Joi.object({
  name: Joi.string().max(100).required().trim(),
  type: Joi.string().valid('income', 'expense').required(),
});

const transactionSchema = Joi.object({
  category_id: Joi.number().integer().positive().allow(null).optional(),
  type: Joi.string().valid('income', 'expense').required(),
  amount: Joi.number().precision(2).required(), // allows negative for refunds
  currency: Joi.string().length(3).uppercase().default('USD'),
  description: Joi.string().max(500).default(''),
  date: Joi.date().iso().required(),
});

const transactionUpdateSchema = Joi.object({
  category_id: Joi.number().integer().positive().allow(null).optional(),
  type: Joi.string().valid('income', 'expense').optional(),
  amount: Joi.number().precision(2).optional(),
  currency: Joi.string().length(3).uppercase().optional(),
  description: Joi.string().max(500).optional(),
  date: Joi.date().iso().optional(),
}).min(1);

const budgetSchema = Joi.object({
  category_id: Joi.number().integer().positive().required(),
  amount: Joi.number().precision(2).positive().required(),
  currency: Joi.string().length(3).uppercase().default('USD'),
  period: Joi.string().valid('monthly', 'yearly').default('monthly'),
});

const budgetUpdateSchema = Joi.object({
  amount: Joi.number().precision(2).positive().optional(),
  currency: Joi.string().length(3).uppercase().optional(),
  period: Joi.string().valid('monthly', 'yearly').optional(),
}).min(1);

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map((d) => d.message),
      });
    }

    req.validatedBody = value;
    next();
  };
}

module.exports = {
  registerSchema,
  loginSchema,
  profileUpdateSchema,
  categorySchema,
  transactionSchema,
  transactionUpdateSchema,
  budgetSchema,
  budgetUpdateSchema,
  validate,
};
