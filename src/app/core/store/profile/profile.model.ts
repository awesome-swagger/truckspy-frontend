export interface Profile {
  id: string;
  name: string;
  email: string;
  lastLogin: string;
  roles: string[];
  timezone: string;
  pic: string;
}

export const DefaultProfile: Profile = {
  id: null,
  name: null,
  email: null,
  lastLogin: null,
  roles: [],
  timezone: null,
  pic: "assets/img/avatars/sunny.png"
};

export function createProfile(data): Profile {
  return {
    id: data.id || DefaultProfile.id,
    name: getName(data) || DefaultProfile.name,
    email: data.email || DefaultProfile.email,
    lastLogin: data.lastLogin || DefaultProfile.lastLogin,
    roles: data.roles || DefaultProfile.roles,
    timezone: data.timezone || DefaultProfile.timezone,
    pic: DefaultProfile.pic // TODO: introduce if needed
  };
}

function getName(data): string {
  let first: string = data.firstName || "";
  let last: string = data.lastName || "";
  return `${first} ${last}`;
}
