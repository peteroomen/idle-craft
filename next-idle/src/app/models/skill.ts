export type Skill = {
    _id: string;
    name: string,
    icon: string,
    routeName: string,
    isCombat: boolean,
    activities: IActivity[]
}

export type IActivity = {
    _id: string,
    action: string,
    name: string,
    icon: string,
    duration: number,
    xp: number,
}
