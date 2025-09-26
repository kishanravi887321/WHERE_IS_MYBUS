import { Organization  } from "../models/org.models.js";

export const createOrganization = async (req, res, next) => {
    try {
        const { orgName, email, phoneNumber, city, state, website_url, location_url, password } = req.body;
        if (!orgName || !email || !phoneNumber || !password) {
            return res.status(400).json({ status: "fail", message: "Organization name, email, phone number, and password are required." });
        }

        const existingOrg = await Organization.findOne({ email });
        if (existingOrg) {
            return res.status(409).json({ status: "fail", message: "Organization with this email already exists." });
        }
        const org = new Organization({
            orgName,
            email,
            phoneNumber,
            city,
            state,
            website_url,
            location_url,
            password
        });

        await org.save();

        res.status(201).json({
            status: "success",
            data: {
                organization: org
            }
        });
    } catch (error) {
        next(error);
    }
};