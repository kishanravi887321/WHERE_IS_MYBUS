import { Organization  } from "../models/org.models.js";
import { Bus } from "../models/bus.models.js";

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

export const getOrganizationBuses = async (req, res, next) => {
  try {
    const { email } = req.body; // GET /organizations/buses/:email
    console.log(email)
    const buses = await Bus.find()
      .populate({
        path: "ownerOrg",
        match: { email: email.toLowerCase().trim() } // filter by org email
      });
      console.log(email)

    // filter out buses where populate didn't match
    const filteredBuses = buses.filter(bus => bus.ownerOrg);

    if (!filteredBuses.length) {
      return res.status(404).json({
        status: "fail",
        message: "No buses found for this organization"
      });
    }

    res.status(200).json({
      status: "success",
      data: { buses: filteredBuses }
    });
  } catch (error) {
    next(error);
  }
};
