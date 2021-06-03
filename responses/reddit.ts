// To parse this data:
//
//   import { Convert, RedditResponse } from "./file";
//
//   const redditResponse = Convert.toRedditResponse(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface RedditResponse {
    kind: string;
    data: RedditResponseData;
}

export interface RedditResponseData {
    modhash: string;
    dist: number;
    children: Child[];
    after: string;
    before: null;
}

export interface Child {
    kind: string;
    data: RedditPost;
}

export interface RedditPost {
    approved_at_utc: null;
    subreddit: string;
    selftext: string;
    author_fullname: unknown;
    saved: boolean;
    mod_reason_title: null;
    gilded: number;
    clicked: boolean;
    title: string;
    link_flair_richtext: unknown[];
    subreddit_name_prefixed: string;
    hidden: boolean;
    pwls: number;
    link_flair_css_class: null;
    downs: number;
    thumbnail_height: number | null;
    top_awarded_type: null;
    hide_score: boolean;
    name: string;
    quarantine: boolean;
    link_flair_text_color: unknown;
    upvote_ratio: number;
    author_flair_background_color: null | string;
    subreddit_type: string;
    ups: number;
    total_awards_received: number;
    media_embed: unknown;
    thumbnail_width: number | null;
    author_flair_template_id: null | string;
    is_original_content: boolean;
    user_reports: unknown[];
    secure_media: null;
    is_reddit_media_domain: boolean;
    is_meta: boolean;
    category: null;
    secure_media_embed: unknown;
    link_flair_text: null;
    can_mod_post: boolean;
    score: number;
    approved_by: null;
    author_premium: unknown;
    thumbnail: string;
    edited: boolean;
    author_flair_css_class?: string | null;
    author_flair_richtext: any[];
    gildings: Gildings;
    content_categories: string[];
    is_self: boolean;
    mod_note: null;
    created: Date;
    link_flair_type: unknown;
    wls: number;
    removed_by_category: null;
    banned_by: null;
    author_flair_type: unknown;
    domain: string;
    allow_live_comments: boolean;
    selftext_html: null | string;
    likes: null;
    suggested_sort: null;
    banned_at_utc: null;
    view_count: null;
    archived: boolean;
    no_follow: boolean;
    is_crosspostable: boolean;
    pinned: boolean;
    over_18: boolean;
    awarders: any[];
    media_only: boolean;
    can_gild: boolean;
    spoiler: boolean;
    locked: boolean;
    author_flair_text: string | null;
    treatment_tags: unknown[];
    visited: boolean;
    removed_by: null;
    num_reports: null;
    distinguished: null | string;
    subreddit_id: string;
    mod_reason_by: null;
    removal_reason: null;
    link_flair_background_color: string;
    id: string;
    is_robot_indexable: boolean;
    report_reasons: null;
    author: string;
    discussion_type: null;
    num_comments: number;
    send_replies: boolean;
    whitelist_status: unknown;
    contest_mode: boolean;
    mod_reports: unknown[];
    author_patreon_flair: unknown;
    author_flair_text_color: unknown | null;
    permalink: string;
    parent_whitelist_status: unknown;
    stickied: boolean;
    url: string;
    subreddit_subscribers: number;
    created_utc: Date;
    num_crossposts: number;
    media: null;
    is_video: boolean;
    post_hint?: string;
    url_overridden_by_dest?: string;
    preview?: Preview;
}

export interface AllAwarding {
    giver_coin_reward: number | null;
    subreddit_id: null;
    is_new: boolean;
    days_of_drip_extension: number;
    coin_price: number;
    id: string;
    penny_donate: number | null;
    award_sub_type: string;
    coin_reward: number;
    icon_url: string;
    days_of_premium: number;
    tiers_by_required_awardings: null;
    resized_icons: ResizedIcon[];
    icon_width: number;
    static_icon_width: number;
    start_date: null;
    is_enabled: boolean;
    awardings_required_to_grant_benefits: null;
    description: string;
    end_date: null;
    subreddit_coin_reward: number;
    count: number;
    static_icon_height: number;
    name: string;
    resized_static_icons: ResizedIcon[];
    icon_format: null | string;
    icon_height: number;
    penny_price: number | null;
    award_type: string;
    static_icon_url: string;
}

export interface ResizedIcon {
    url: string;
    width: number;
    height: number;
}

export interface Gildings {
    gid_1?: number;
}

export enum PostHint {
    Image = "image",
}

export interface Preview {
    images: Image[];
    enabled: boolean;
}

export interface Image {
    source: ResizedIcon;
    resolutions: ResizedIcon[];
    variants: unknown;
    id: string;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toRedditResponse(json: string): RedditResponse {
        return cast(JSON.parse(json), r("RedditResponse"));
    }

    public static redditResponseToJson(value: RedditResponse): string {
        return JSON.stringify(uncast(value, r("RedditResponse")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any = ''): never {
    if (key) {
        throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
    }
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`,);
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) { }
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    // In this implementation, dates can either be Date objects, or epoch SECONDS
    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = typeof val == "number" ? new Date(val * 1000) : val;
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, prop.key);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems") ? transformArray(typ.arrayItems, val)
                : typ.hasOwnProperty("props") ? transformObject(getProps(typ), typ.additional, val)
                    : invalidValue(typ, val);
    }
    if (typ === Date) return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "RedditResponse": o([
        { json: "kind", js: "kind", typ: "" },
        { json: "data", js: "data", typ: r("RedditResponseData") },
    ], false),
    "RedditResponseData": o([
        { json: "modhash", js: "modhash", typ: "" },
        { json: "dist", js: "dist", typ: 0 },
        { json: "children", js: "children", typ: a(r("Child")) },
        { json: "after", js: "after", typ: "" },
        { json: "before", js: "before", typ: u("", null) },
    ], false),
    "Child": o([
        { json: "kind", js: "kind", typ: "" },
        { json: "data", js: "data", typ: r("RedditPost") },
    ], false),
    "RedditPost": o([
        { json: "approved_at_utc", js: "approved_at_utc", typ: u(Date, null) },
        { json: "subreddit", js: "subreddit", typ: "" },
        { json: "selftext", js: "selftext", typ: "" },
        { json: "author_fullname", js: "author_fullname", typ: "any" },
        { json: "saved", js: "saved", typ: true },
        { json: "mod_reason_title", js: "mod_reason_title", typ: u("", null) },
        { json: "gilded", js: "gilded", typ: 0 },
        { json: "clicked", js: "clicked", typ: true },
        { json: "title", js: "title", typ: "" },
        { json: "link_flair_richtext", js: "link_flair_richtext", typ: "any" },
        { json: "subreddit_name_prefixed", js: "subreddit_name_prefixed", typ: "" },
        { json: "hidden", js: "hidden", typ: true },
        { json: "pwls", js: "pwls", typ: 0 },
        { json: "link_flair_css_class", js: "link_flair_css_class", typ: u("", null) },
        { json: "downs", js: "downs", typ: 0 },
        { json: "thumbnail_height", js: "thumbnail_height", typ: u(0, null) },
        { json: "top_awarded_type", js: "top_awarded_type", typ: "any" },
        { json: "hide_score", js: "hide_score", typ: true },
        { json: "name", js: "name", typ: "" },
        { json: "quarantine", js: "quarantine", typ: true },
        { json: "link_flair_text_color", js: "link_flair_text_color", typ: "any" },
        { json: "link_flair_template_id", js: "link_flair_template_id", typ: u("", null, undefined) },
        { json: "upvote_ratio", js: "upvote_ratio", typ: 3.14 },
        { json: "author_flair_background_color", js: "author_flair_background_color", typ: u(null, "") },
        { json: "subreddit_type", js: "subreddit_type", typ: "" },
        { json: "ups", js: "ups", typ: 0 },
        { json: "total_awards_received", js: "total_awards_received", typ: 0 },
        { json: "media_embed", js: "media_embed", typ: "any" },
        { json: "thumbnail_width", js: "thumbnail_width", typ: u(0, null) },
        { json: "author_flair_template_id", js: "author_flair_template_id", typ: u(null, "") },
        { json: "is_original_content", js: "is_original_content", typ: true },
        { json: "user_reports", js: "user_reports", typ: "any" },
        { json: "secure_media", js: "secure_media", typ: "any" },
        { json: "is_reddit_media_domain", js: "is_reddit_media_domain", typ: true },
        { json: "is_meta", js: "is_meta", typ: true },
        { json: "category", js: "category", typ: "any" },
        { json: "secure_media_embed", js: "secure_media_embed", typ: "any" },
        { json: "link_flair_text", js: "link_flair_text", typ: "any" },
        { json: "can_mod_post", js: "can_mod_post", typ: true },
        { json: "score", js: "score", typ: 0 },
        { json: "approved_by", js: "approved_by", typ: "any" },
        { json: "author_premium", js: "author_premium", typ: "any" },
        { json: "thumbnail", js: "thumbnail", typ: "" },
        { json: "edited", js: "edited", typ: true },
        { json: "author_flair_css_class", js: "author_flair_css_class", typ: u("", null) },
        { json: "author_flair_richtext", js: "author_flair_richtext", typ: "any" },
        { json: "gildings", js: "gildings", typ: r("Gildings") },
        { json: "content_categories", js: "content_categories", typ: u(a(""), null) },
        { json: "is_self", js: "is_self", typ: true },
        { json: "mod_note", js: "mod_note", typ: "any" },
        { json: "created", js: "created", typ: Date },
        { json: "link_flair_type", js: "link_flair_type", typ: "any" },
        { json: "wls", js: "wls", typ: 0 },
        { json: "removed_by_category", js: "removed_by_category", typ: "any" },
        { json: "banned_by", js: "banned_by", typ: "any" },
        { json: "author_flair_type", js: "author_flair_type", typ: "any" },
        { json: "domain", js: "domain", typ: "" },
        { json: "allow_live_comments", js: "allow_live_comments", typ: true },
        { json: "selftext_html", js: "selftext_html", typ: u(null, "") },
        { json: "likes", js: "likes", typ: u(0, null) },
        { json: "suggested_sort", js: "suggested_sort", typ: "any" },
        { json: "banned_at_utc", js: "banned_at_utc", typ: u(Date, null) },
        { json: "view_count", js: "view_count", typ: u(0, null) },
        { json: "archived", js: "archived", typ: true },
        { json: "no_follow", js: "no_follow", typ: true },
        { json: "is_crosspostable", js: "is_crosspostable", typ: true },
        { json: "pinned", js: "pinned", typ: true },
        { json: "over_18", js: "over_18", typ: true },
        { json: "all_awardings", js: "all_awardings", typ: "any" },
        { json: "awarders", js: "awarders", typ: "any" },
        { json: "media_only", js: "media_only", typ: true },
        { json: "can_gild", js: "can_gild", typ: true },
        { json: "spoiler", js: "spoiler", typ: true },
        { json: "locked", js: "locked", typ: true },
        { json: "author_flair_text", js: "author_flair_text", typ: u("", null) },
        { json: "treatment_tags", js: "treatment_tags", typ: "any" },
        { json: "visited", js: "visited", typ: true },
        { json: "removed_by", js: "removed_by", typ: "any" },
        { json: "num_reports", js: "num_reports", typ: u(0, null) },
        { json: "distinguished", js: "distinguished", typ: u(null, "") },
        { json: "subreddit_id", js: "subreddit_id", typ: "" },
        { json: "mod_reason_by", js: "mod_reason_by", typ: "any" },
        { json: "removal_reason", js: "removal_reason", typ: "any" },
        { json: "link_flair_background_color", js: "link_flair_background_color", typ: "" },
        { json: "id", js: "id", typ: "" },
        { json: "is_robot_indexable", js: "is_robot_indexable", typ: true },
        { json: "report_reasons", js: "report_reasons", typ: "any" },
        { json: "author", js: "author", typ: "" },
        { json: "discussion_type", js: "discussion_type", typ: "any" },
        { json: "num_comments", js: "num_comments", typ: 0 },
        { json: "send_replies", js: "send_replies", typ: true },
        { json: "whitelist_status", js: "whitelist_status", typ: "any" },
        { json: "contest_mode", js: "contest_mode", typ: true },
        { json: "mod_reports", js: "mod_reports", typ: "any" },
        { json: "author_patreon_flair", js: "author_patreon_flair", typ: "any" },
        { json: "author_flair_text_color", js: "author_flair_text_color", typ: u("any", null) },
        { json: "permalink", js: "permalink", typ: "" },
        { json: "parent_whitelist_status", js: "parent_whitelist_status", typ: "any" },
        { json: "stickied", js: "stickied", typ: true },
        { json: "url", js: "url", typ: "" },
        { json: "subreddit_subscribers", js: "subreddit_subscribers", typ: 0 },
        { json: "created_utc", js: "created_utc", typ: Date },
        { json: "num_crossposts", js: "num_crossposts", typ: 0 },
        { json: "media", js: "media", typ: "any" },
        { json: "is_video", js: "is_video", typ: true },
        { json: "post_hint", js: "post_hint", typ: u(undefined, "") },
        { json: "url_overridden_by_dest", js: "url_overridden_by_dest", typ: u(undefined, "") },
        { json: "preview", js: "preview", typ: u(undefined, r("Preview")) },
    ], "any"),
    "AllAwarding": o([
        { json: "giver_coin_reward", js: "giver_coin_reward", typ: u(0, null) },
        { json: "subreddit_id", js: "subreddit_id", typ: "any" },
        { json: "is_new", js: "is_new", typ: true },
        { json: "days_of_drip_extension", js: "days_of_drip_extension", typ: 0 },
        { json: "coin_price", js: "coin_price", typ: 0 },
        { json: "id", js: "id", typ: "" },
        { json: "penny_donate", js: "penny_donate", typ: u(0, null) },
        { json: "award_sub_type", js: "award_sub_type", typ: r("AwardSubType") },
        { json: "coin_reward", js: "coin_reward", typ: 0 },
        { json: "icon_url", js: "icon_url", typ: "" },
        { json: "days_of_premium", js: "days_of_premium", typ: 0 },
        { json: "tiers_by_required_awardings", js: "tiers_by_required_awardings", typ: "any" },
        { json: "resized_icons", js: "resized_icons", typ: a(r("ResizedIcon")) },
        { json: "icon_width", js: "icon_width", typ: 0 },
        { json: "static_icon_width", js: "static_icon_width", typ: 0 },
        { json: "start_date", js: "start_date", typ: u(Date, null) },
        { json: "is_enabled", js: "is_enabled", typ: true },
        { json: "awardings_required_to_grant_benefits", js: "awardings_required_to_grant_benefits", typ: "any" },
        { json: "description", js: "description", typ: "" },
        { json: "end_date", js: "end_date", typ: u(Date, null) },
        { json: "subreddit_coin_reward", js: "subreddit_coin_reward", typ: 0 },
        { json: "count", js: "count", typ: 0 },
        { json: "static_icon_height", js: "static_icon_height", typ: 0 },
        { json: "name", js: "name", typ: "" },
        { json: "resized_static_icons", js: "resized_static_icons", typ: a(r("ResizedIcon")) },
        { json: "icon_format", js: "icon_format", typ: u(null, "") },
        { json: "icon_height", js: "icon_height", typ: 0 },
        { json: "penny_price", js: "penny_price", typ: u(0, null) },
        { json: "award_type", js: "award_type", typ: r("AwardType") },
        { json: "static_icon_url", js: "static_icon_url", typ: "" },
    ], "any"),
    "ResizedIcon": o([
        { json: "url", js: "url", typ: "" },
        { json: "width", js: "width", typ: 0 },
        { json: "height", js: "height", typ: 0 },
    ], "any"),
    "Gildings": o([
        { json: "gid_1", js: "gid_1", typ: u(undefined, 0) },
    ], "any"),
    "MediaEmbed": o([
    ], "any"),
    "Preview": o([
        { json: "images", js: "images", typ: "any" },
        { json: "enabled", js: "enabled", typ: true },
    ], "any"),
    "Image": o([
        { json: "source", js: "source", typ: r("ResizedIcon") },
        { json: "resolutions", js: "resolutions", typ: a(r("ResizedIcon")) },
        { json: "variants", js: "variants", typ: r("MediaEmbed") },
        { json: "id", js: "id", typ: "" },
    ], "any"),
    "PostHint": [
        "image",
    ]
};
