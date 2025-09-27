import { Organization  } from "../models/org.models.js";
import { Bus } from "../models/bus.models.js";
import { User } from "../models/user.models.js";

export const createOrganization = async (req, res, next) => {
    try {
        const { orgName, email, phoneNumber, city, state, website_url, location_url, password} = req.body;
        if (!orgName || !email || !phoneNumber || !password ) {
            return res.status(400).json({ status: "fail", message: "Organization name, email, phone number, and password are required." });
        }
        const user= await User.findOne({email:req.user.email});
        if(!user){
            return res.status(409).json({ status: "fail", message: "User with this email does not exist." });
        }

        const existingOrg = await Organization.findOne({ email });
        if (existingOrg) {
            return res.status(409).json({ status: "fail", message: "Organization with this email already exists." });
        }
        const org = new Organization({
          username:user._id,
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
    const  email  = req.user.email; // GET /organizations/buses/:email
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


export const checkOrganizationExists = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ status: "fail", message: "Email is required." });
        }

        const user= await User.findOne({email:email.toLowerCase().trim()});
        if(!user){
            return res.status(409).json({ status: "fail", message: "User with this email does not exist." });
        }
        const org = await Organization.findOne({ username:user._id  });
        if (!org) {
            return res.status(409).json({ status: "fail", message: "Organization with this email does not exist." });
        }
        res.status(200).json({ status: "success", message: "Organization exists.", data: { organization: org } });
    } catch (error) {
        next(error);
    }
};